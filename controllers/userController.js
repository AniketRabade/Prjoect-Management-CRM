
import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import cookieOptions from '../utils/cookieOptions.js';
import cloudinary from '../config/cloudinary.js';
import ErrorResponse from '../utils/errorResponse.js';


// @desc    Register a user (Admin only)
// @route   POST /api/v1/users/register
// @access  Private/Admin


// export const registerUser = async (req, res, next) => {
//   try {
//     const { name, email, password, phone, accountType, permissions } = req.body;

//     const user = await User.create({
//       name,
//       email,
//       password,
//       phone,
//       accountType,
//       permissions
//     });

//     const token = generateToken(user._id);

//     res.cookie('token', token, cookieOptions);

//     res.status(201).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         accountType: user.accountType
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// export const registerUser = async (req, res, next) => {
//   try {
//     const { name, email, password, phone, accountType, permissions } = req.body;
//     let profilePicture = 'default-profile.jpg';

//     // Handle file upload if exists
//     if (req.file) {
//       try {
//         // Convert buffer to data URI for Cloudinary
//         const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
//         const result = await cloudinary.uploader.upload(dataUri, {
//           folder: 'user-profiles',
//           width: 500,
//           height: 500,
//           crop: 'fill'
//         });
//         profilePicture = result.secure_url;
//       } catch (uploadErr) {
//         return next(new ErrorResponse('Failed to upload profile picture', 500));
//       }
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       phone,
//       accountType,
//       permissions,
//       profilePicture
//     });

//     const token = generateToken(user._id);
//     res.cookie('token', token, cookieOptions);

//     res.status(201).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         accountType: user.accountType,
//         profilePicture: user.profilePicture
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const registerUser = async (req, res, next) => {
  try {
    // Clean the input data by removing unwanted quotes and whitespace
    const cleanData = {
      name: req.body.name?.trim(),
      email: req.body.email?.replace(/^"+|"+$/g, '').trim().toLowerCase(),
      password: req.body.password,
      phone: req.body.phone?.replace(/^"+|"+$/g, '').trim(),
      accountType: req.body.accountType,
      permissions: req.body.permissions
    };

    let profilePicture = 'default-profile.jpg';

    // Handle file upload if exists
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'user-profiles',
          width: 500,
          height: 500,
          crop: 'fill',
          resource_type: 'auto'
        });

        profilePicture = result.secure_url;
      } catch (uploadErr) {
        return next(new ErrorResponse(`Profile picture upload failed: ${uploadErr.message}`, 500));
      }
    }

    // Create user with cleaned data
    const user = await User.create({
      ...cleanData,
      profilePicture
    });

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Clean and normalize email
    const cleanEmail = email.replace(/^"+|"+$/g, '').trim().toLowerCase();

    // Find user with password
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      console.log(`Login attempt failed: No user found with email ${cleanEmail}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Debug: Log stored and provided password hashes
    // console.log('Stored hashed password:', user.password);
    // console.log('Provided password:', password);

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log(`Login attempt failed: Password mismatch for user ${user._id}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        profilePicture: user.profilePicture,
        permissions:user.permissions
      }
    });
    console.log("login sucessfully");

  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

// @desc    Logout user
// @route   GET /api/v1/users/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    // const users = await User.find().select('-password');
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin

// export const updateUser = async (req, res, next) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     }).select('-password');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: user
//     });
//   } catch (err) {
//     next(err);
//   }
// };



export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle file upload if exists
    if (req.file) {
      try {
        // Get current user first
        const currentUser = await User.findById(id);
        
        // Delete old image if it exists and isn't default
        if (currentUser?.profilePicture && 
            !currentUser.profilePicture.includes('default-profile')) {
          const publicId = currentUser.profilePicture
            .split('/')
            .slice(-2)
            .join('/')
            .split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }

        // Upload new image
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'user-profiles',
          width: 500,
          height: 500,
          crop: 'fill'
        });
        updateData.profilePicture = result.secure_url;
      } catch (uploadErr) {
        return next(new ErrorResponse('Failed to update profile picture', 500));
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete profile picture from Cloudinary if it exists and isn't default
    if (user.profilePicture && 
        !user.profilePicture.includes('default-profile')) {
      try {
        // Extract public ID from URL
        const urlParts = user.profilePicture.split('/');
        const publicIdWithFolder = urlParts
          .slice(urlParts.indexOf('user-profiles'))
          .join('/')
          .split('.')[0];
        
        await cloudinary.uploader.destroy(publicIdWithFolder);
      } catch (cloudinaryErr) {
        console.error('Failed to delete Cloudinary image:', cloudinaryErr);
        // Continue with user deletion even if image deletion fails
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Delete user error:', err);
    next(err);
  }
}

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};









