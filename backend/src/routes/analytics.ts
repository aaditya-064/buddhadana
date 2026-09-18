import { Router } from 'express';
import { SalesRecord, PurchaseRecord, ExpenseRecord } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

// GET /api/analytics/summary
analyticsRouter.get('/summary', async (req, res, next) => {
  try {
    const dateFilter: any = {};
    if (req.query.dateFrom || req.query.dateTo) {
      dateFilter.date = {};
      if (req.query.dateFrom) dateFilter.date.$gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) dateFilter.date.$lte = new Date(req.query.dateTo as string);
    }

    const [salesAgg, purchaseAgg, expenseAgg] = await Promise.all([
      SalesRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      PurchaseRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      ExpenseRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalSales = salesAgg[0]?.total || 0;
    const totalPurchases = purchaseAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const revenue = totalSales;
    const grossProfit = totalSales - totalPurchases;
    const netProfit = totalSales - totalPurchases - totalExpenses;

    const totalCustomers = await SalesRecord.distinct('customer', dateFilter).then((d) => d.length);
    const totalSuppliers = await PurchaseRecord.distinct('supplier', dateFilter).then((d) => d.length);
    const totalProducts = await SalesRecord.distinct('product', dateFilter).then((d) => d.length);

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses,
      revenue,
      grossProfit,
      netProfit,
      totalCustomers,
      totalSuppliers,
      totalProducts,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/timeline
analyticsRouter.get('/timeline', async (req, res, next) => {
  try {
    const groupBy = (req.query.groupBy as string) || 'month';
    let dateFormat = '%Y-%m';
    if (groupBy === 'day') dateFormat = '%Y-%m-%d';
    if (groupBy === 'year') dateFormat = '%Y';

    const dateFilter: any = {};
    if (req.query.dateFrom || req.query.dateTo) {
      dateFilter.date = {};
      if (req.query.dateFrom) dateFilter.date.$gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) dateFilter.date.$lte = new Date(req.query.dateTo as string);
    }

    const [salesTimeline, purchaseTimeline, expenseTimeline] = await Promise.all([
      SalesRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, sales: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ]),
      PurchaseRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, purchases: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ]),
      ExpenseRecord.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, expenses: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Merge timelines
    const periodMap = new Map<string, any>();
    for (const s of salesTimeline) periodMap.set(s._id, { period: s._id, sales: s.sales, purchases: 0, expenses: 0, revenue: s.sales });
    for (const p of purchaseTimeline) {
      const existing = periodMap.get(p._id) || { period: p._id, sales: 0, purchases: 0, expenses: 0, revenue: 0 };
      existing.purchases = p.purchases;
      periodMap.set(p._id, existing);
    }
    for (const e of expenseTimeline) {
      const existing = periodMap.get(e._id) || { period: e._id, sales: 0, purchases: 0, expenses: 0, revenue: 0 };
      existing.expenses = e.expenses;
      periodMap.set(e._id, existing);
    }

    const timeline = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
    res.json(timeline);
  } catch (err) { next(err); }
});
