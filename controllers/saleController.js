//saleController.js
import Sale from '../models/Sale.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// Helper function for date formatting
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// @desc    Get all sales
// @route   GET /api/v1/sales
// @access  Private/Admin/Manager
export const getAllSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('project', 'projectName status')
      .populate('client', 'name')
      .populate('salesperson', 'name email')
      .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales statistics
// @route   GET /api/v1/sales/stats
// @access  Private/Admin/Manager
export const getSalesStats = async (req, res, next) => {
  try {
    const stats = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          avgSale: { $avg: '$amount' },
          minSale: { $min: '$amount' },
          maxSale: { $max: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          avgSale: { $round: ['$avgSale', 2] },
          minSale: 1,
          maxSale: 1,
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales by date range
// @route   GET /api/v1/sales/date-range
// @access  Private/Admin/Manager
export const getSalesByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(new ErrorResponse('Please provide both startDate and endDate', 400));
    }

    const sales = await Sale.find({
      saleDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('project', 'projectName')
    .populate('client', 'name')
    .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user's sales
// @route   GET /api/v1/sales/my-sales
// @access  Private
export const getMySales = async (req, res, next) => {
  try {
    const sales = await Sale.find({ salesperson: req.user.id })
      .populate('project', 'projectName')
      .populate('client', 'name')
      .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales by project
// @route   GET /api/v1/sales/project/:projectId
// @access  Private/Admin/Manager
export const getSalesByProject = async (req, res, next) => {
  try {
    const sales = await Sale.find({ project: req.params.projectId })
      .populate('client', 'name')
      .populate('salesperson', 'name email')
      .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales by client
// @route   GET /api/v1/sales/client/:clientId
// @access  Private/Admin/Manager
export const getSalesByClient = async (req, res, next) => {
  try {
    const sales = await Sale.find({ client: req.params.clientId })
      .populate('project', 'projectName')
      .populate('salesperson', 'name email')
      .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create sale
// @route   POST /api/v1/sales
// @access  Private/Admin/Manager/Employee
export const createSale = async (req, res, next) => {
  try {
    // Add salesperson to the request body
    req.body.salesperson = req.user.id;

    console.log(req.body);
    //check saleperson is exit
    const salesperson=await User.findById(req.user.id).select('-password');
    if(!salesperson){
      return next(new ErrorResponse('Saleperson not found', 404));
    }

    // Validate project exists
    const project = await Project.findById(req.body.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Validate client exists
    const client = await Client.findById(req.body.client);
    if (!client) {
      return next(new ErrorResponse('Client not found', 404));
    }

    const sale = await Sale.create(req.body);

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single sale
// @route   GET /api/v1/sales/:id
// @access  Private
export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('project', 'projectName')
      .populate('client', 'name')
      .populate('salesperson', 'name email');

    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

    // Check if user has access
    if (sale.salesperson.toString() !== req.user.id && 
        req.user.accountType !== 'admin' && 
        req.user.accountType !== 'manager') {
      return next(new ErrorResponse('Not authorized to access this sale', 403));
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update sale
// @route   PUT /api/v1/sales/:id
// @access  Private/Admin/Manager/Employee
export const updateSale = async (req, res, next) => {
  try {
    let sale = await Sale.findById(req.params.id);

    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

    // Check permissions
    if (sale.salesperson.toString() !== req.user.id && 
        req.user.accountType !== 'admin' && 
        req.user.accountType !== 'manager') {
      return next(new ErrorResponse('Not authorized to update this sale', 403));
    }

    // Prevent changing certain fields
    const { salesperson, project, client, ...updateData } = req.body;

    sale = await Sale.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete sale
// @route   DELETE /api/v1/sales/:id
// @access  Private/Admin
export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

      await Sale.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};





