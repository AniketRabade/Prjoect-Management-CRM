// leadController.js
import Client from '../models/Client.js';
import Lead from '../models/Leads.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create a new lead
// @route   POST /api/v1/leads
// @access  Private/Admin/Manager/Employee
export const createLead = async (req, res, next) => {
  try {
    // Add createdBy to the request body
    req.body.createdBy = req.user.id;

    // If assignedTo is provided, validate the user exists
    if (req.body.assignedTo) {
      const assignedUser = await User.findById(req.body.assignedTo);
      if (!assignedUser) {
        return next(new ErrorResponse('Assigned user not found', 404));
      }
    }

    const lead = await Lead.create(req.body);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all leads
// @route   GET /api/v1/leads
// @access  Private/Admin/Manager
export const getAllLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single lead
// @route   GET /api/v1/leads/:id
// @access  Private
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('client', 'name email');

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    // Check if user has access to the lead
    if (
      lead.assignedTo?._id.toString() !== req.user.id &&
      lead.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return next(new ErrorResponse('Not authorized to access this lead', 403));
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lead
// @route   PUT /api/v1/leads/:id
// @access  Private/Admin/Manager/Employee
export const updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    // Check permissions
    if (
      lead.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return next(new ErrorResponse('Not authorized to update this lead', 403));
    }

    // Prevent changing certain fields
    const { createdBy, client, ...updateData } = req.body;

    lead = await Lead.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete lead
// @route   DELETE /api/v1/leads/:id
// @access  Private/Admin/Manager
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    // Check permissions
    if (
      lead.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin'
    ) {
      return next(new ErrorResponse('Not authorized to delete this lead', 403));
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user's leads
// @route   GET /api/v1/leads/my-leads
// @access  Private
export const getMyLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({ assignedTo: req.user.id })
      .populate('createdBy', 'name email')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Convert lead to client
// @route   POST /api/v1/leads/:id/convert
// @access  Private/Admin/Manager
export const convertLeadToClient = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    // Check if lead is already converted
    if (lead.client) {
      return next(new ErrorResponse('Lead already converted to client', 400));
    }

    // Check permissions
    if (
      lead.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return next(new ErrorResponse('Not authorized to convert this lead', 403));
    }

    // Create new client from lead data
    const clientData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      description: `Converted from lead on ${new Date().toLocaleDateString()}`
    };

    const client = await Client.create(clientData);

    // Update lead with client reference and mark as converted
    lead.client = client._id;
    lead.status = 'Closed Won';
    lead.conversionDate = new Date();
    await lead.save();

    res.status(200).json({
      success: true,
      data: {
        lead,
        client
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leads by status
// @route   GET /api/v1/leads/status/:status
// @access  Private/Admin/Manager
export const getLeadsByStatus = async (req, res, next) => {
  try {
    const leads = await Lead.find({ status: req.params.status })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leads by source
// @route   GET /api/v1/leads/source/:source
// @access  Private/Admin/Manager
export const getLeadsBySource = async (req, res, next) => {
  try {
    const leads = await Lead.find({ source: req.params.source })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get lead statistics
// @route   GET /api/v1/leads/stats/overview
// @access  Private/Admin/Manager
export const getLeadsStats = async (req, res, next) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $ifNull: ['$client', false] }, 1, 0] }
          },
          avgPotentialValue: { $avg: '$potentialValue' },
          byStatus: { $push: '$status' },
          bySource: { $push: '$source' }
        }
      },
      {
        $project: {
          _id: 0,
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $round: [
              { $multiply: [
                { $divide: ['$convertedLeads', '$totalLeads'] },
                100
              ]},
              2
            ]
          },
          avgPotentialValue: { $round: ['$avgPotentialValue', 2] },
          statusCount: {
            $reduce: {
              input: '$byStatus',
              initialValue: [],
              in: {
                $let: {
                  vars: {
                    existing: {
                      $filter: {
                        input: '$$value',
                        as: 'item',
                        cond: { $eq: ['$$item.status', '$$this'] }
                      }
                    }
                  },
                  in: {
                    $cond: [
                      { $eq: [{ $size: '$$existing' }, 0] },
                      { $concatArrays: [
                        '$$value',
                        [{ status: '$$this', count: 1 }]
                      ]},
                      { $map: {
                        input: '$$value',
                        as: 'item',
                        in: {
                          $cond: [
                            { $eq: ['$$item.status', '$$this'] },
                            { status: '$$this', count: { $add: ['$$item.count', 1] } },
                            '$$item'
                          ]
                        }
                      }}
                    ]
                  }
                }
              }
            }
          },
          sourceCount: {
            $reduce: {
              input: '$bySource',
              initialValue: [],
              in: {
                $let: {
                  vars: {
                    existing: {
                      $filter: {
                        input: '$$value',
                        as: 'item',
                        cond: { $eq: ['$$item.source', '$$this'] }
                      }
                    }
                  },
                  in: {
                    $cond: [
                      { $eq: [{ $size: '$$existing' }, 0] },
                      { $concatArrays: [
                        '$$value',
                        [{ source: '$$this', count: 1 }]
                      ]},
                      { $map: {
                        input: '$$value',
                        as: 'item',
                        in: {
                          $cond: [
                            { $eq: ['$$item.source', '$$this'] },
                            { source: '$$this', count: { $add: ['$$item.count', 1] } },
                            '$$item'
                          ]
                        }
                      }}
                    ]
                  }
                }
              }
            }
          }
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

// @desc    Get recent leads
// @route   GET /api/v1/leads/recent/:limit?
// @access  Private/Admin/Manager
export const getRecentLeads = async (req, res, next) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lead status
// @route   PATCH /api/v1/leads/:id/status
// @access  Private/Admin/Manager/Employee
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return next(new ErrorResponse('Please provide status', 400));
    }

    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    // Check permissions
    if (
      lead.assignedTo?._id.toString() !== req.user.id &&
      lead.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return next(new ErrorResponse('Not authorized to update this lead status', 403));
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign lead to user
// @route   PUT /api/v1/leads/:id/assign
// @access  Private/Admin/Manager
export const assignLead = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return next(new ErrorResponse('Please provide user ID to assign', 400));
    }

    // Validate assigned user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return next(new ErrorResponse('Lead not found', 404));
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
};