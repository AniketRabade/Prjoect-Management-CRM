import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// Helper function to get start/end of day
const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// @desc    Check-in user
// @route   POST /api/v1/attendance/check-in
// @access  Private
export const checkIn = async (req, res, next) => {
  try {
    const today = new Date();
    const { start } = getDayRange(today);

    // Check for existing attendance
    const existing = await Attendance.findOne({
      user: req.user.id,
      date: { $gte: start }
    });

    if (existing) {
      return next(new ErrorResponse('Already checked in today', 400));
    }

    const now = new Date();
    const expectedCheckIn = new Date(now);
    expectedCheckIn.setHours(9, 30, 0, 0); // 9:30 AM standard

    // Calculate status
    let status = 'present';
    let lateMinutes = 0;

    if (now > expectedCheckIn) {
      lateMinutes = Math.round((now - expectedCheckIn) / (1000 * 60));
      status = lateMinutes > 30 ? 'late' : 'present';
    }

    // Create record
    const attendance = await Attendance.create({
      user: req.user.id,
      date: today,
      checkIn: now,
      status,
      lateMinutes,
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      },
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check-out user
// @route   PUT /api/v1/attendance/check-out
// @access  Private
export const checkOut = async (req, res, next) => {
  try {
    const today = new Date();
    const { start } = getDayRange(today);

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: { $gte: start },
      checkOut: { $exists: false }
    });

    if (!attendance) {
      return next(new ErrorResponse('No active check-in found', 404));
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate working hours
    const hoursWorked = (now - attendance.checkIn) / (1000 * 60 * 60);

    // Update status if autoStatus is true
    if (attendance.autoStatus) {
      if (hoursWorked < 4) {
        attendance.status = 'half-day';
      } else if (hoursWorked < 6 && attendance.status === 'present') {
        attendance.status = 'half-day';
      }
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance statistics
// @route   GET /api/v1/attendance/stats
// @access  Private/Admin
export const getAttendanceStats = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const { start, end } = getDayRange(new Date(startDate || endDate || Date.now()));

    const match = {
      date: { $gte: new Date(startDate || start), $lte: new Date(endDate || end) }
    };

    if (department) {
      const users = await User.find({ department }).select('_id');
      match.user = { $in: users.map(u => u._id) };
    }

    const stats = await Attendance.aggregate([
      { $match: match },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        users: { $addToSet: '$user' }
      }},
      { $project: {
        status: '$_id',
        count: 1,
        uniqueUsers: { $size: '$users' },
        _id: 0
      }}
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all attendance records
// @route   GET /api/v1/attendance
// @access  Private/Admin
export const getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, userId, status } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (userId) query.user = userId;
    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate('user', 'name email department')
      .sort('-date')
      .lean();

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's attendance
// @route   GET /api/v1/attendance/my-attendance
// @access  Private
export const getUserAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = { user: req.user.id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort('-date')
      .limit(31); // Max 31 days in month

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update attendance record
// @route   PUT /api/v1/attendance/:id
// @access  Private/Admin
export const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!attendance) {
      return next(new ErrorResponse('Attendance not found', 404));
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update attendance status
// @route   PATCH /api/v1/attendance/:id/status
// @access  Private/Admin
export const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        notes,
        autoStatus: false // Manual override
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!attendance) {
      return next(new ErrorResponse('Attendance not found', 404));
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk update attendance status
// @route   POST /api/v1/attendance/bulk-status
// @access  Private/Admin
export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { date, status, userIds, notes } = req.body;
    const { start, end } = getDayRange(new Date(date));

    const result = await Attendance.updateMany(
      {
        date: { $gte: start, $lte: end },
        user: { $in: userIds }
      },
      {
        status,
        notes,
        autoStatus: false
      }
    );

    res.status(200).json({
      success: true,
      data: {
        matched: result.matchedCount,
        updated: result.modifiedCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/v1/attendance/:id
// @access  Private/Admin
export const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return next(new ErrorResponse('Attendance not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};