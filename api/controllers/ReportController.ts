import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { reportService } from '../services/ReportService';

export class ReportController {
  async generateDailyReport(req: AuthRequest, res: Response) {
    try {
      const { date } = req.body;
      const report = await reportService.generateDailyReport(date);

      res.status(201).json({
        success: true,
        data: report,
        message: '日报表生成成功'
      });
    } catch (error: any) {
      console.error('[ReportController] GenerateDailyReport error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '生成日报表失败'
      });
    }
  }

  async getLatest(req: AuthRequest, res: Response) {
    try {
      const report = reportService.getLatest();
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('[ReportController] GetLatest error:', error);
      res.status(500).json({
        success: false,
        message: '获取最新报表失败'
      });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = reportService.getById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '报表不存在'
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('[ReportController] GetById error:', error);
      res.status(500).json({
        success: false,
        message: '获取报表失败'
      });
    }
  }

  async getByDateRange(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: '请提供开始日期和结束日期'
        });
      }

      const reports = reportService.getByDateRange(
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('[ReportController] GetByDateRange error:', error);
      res.status(500).json({
        success: false,
        message: '获取报表列表失败'
      });
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const stats = reportService.getDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[ReportController] GetDashboardStats error:', error);
      res.status(500).json({
        success: false,
        message: '获取仪表盘统计失败'
      });
    }
  }

  async getTrendData(req: AuthRequest, res: Response) {
    try {
      const { days } = req.query;
      const reports = reportService.getTrendData(
        days ? parseInt(days as string) : 7
      );

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('[ReportController] GetTrendData error:', error);
      res.status(500).json({
        success: false,
        message: '获取趋势数据失败'
      });
    }
  }

  async downloadReport(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = reportService.getById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '报表不存在'
        });
      }

      const csvContent = this.generateCSV(report);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="daily-report-${report.reportDate}.csv"`);
      res.write('\uFEFF');
      res.send(csvContent);
    } catch (error) {
      console.error('[ReportController] DownloadReport error:', error);
      res.status(500).json({
        success: false,
        message: '下载报表失败'
      });
    }
  }

  private generateCSV(report: any): string {
    const headers = [
      '报表日期', '总订单数', '完成订单', '取消订单', '待处理订单',
      '总飞行距离(米)', '总飞行时间(秒)', '平均配送时间(秒)', '准时率(%)',
      '活跃无人机', '维护无人机',
      '异常事件数', '营收(元)'
    ];

    const values = [
      report.reportDate,
      report.totalOrders,
      report.completedOrders,
      report.cancelledOrders,
      report.pendingOrders,
      report.totalDistance,
      report.totalFlightTime,
      report.avgDeliveryTime,
      report.successRate,
      report.dronesActive,
      report.dronesInMaintenance,
      report.abnormalCount,
      report.revenue
    ];

    return headers.join(',') + '\n' + values.join(',') + '\n';
  }
}

export const reportController = new ReportController();
