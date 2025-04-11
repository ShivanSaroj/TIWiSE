// const { signupValidation,loginValidation } = require('../middlewares/AuthValidation');
const {
    signup,
    login,
    updateUserProfile,
    logout,
    authStatus,
    setup2FA,
    verify2FA,
    reset2FA
}=require('../controllers/authcontroller.js');
const ensureAuthenticated =require("../middlewares/Auth")
const passport=require('passport');
const router = require('express').Router();


//router.post('/login',loginValidation,login);
router.post('/login',passport.authenticate("local"),login);

router.post('/signup',signup);
router.get('/status',authStatus); //Auth status

//logout 

router.post('/logout',logout);
//2FA setup

router.post('/2fa/setup',(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
},setup2FA);

//verify 2FA route

router.post('/2fa/verify',verify2FA,(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
});

//reset 2fa route

router.post('/2fa/reset',(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
},reset2FA);

// routes/authRoutes.js

router.get("/profile", (req, res) => {

  console.log("Request user "+req.user);
  
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
  
    res.json({
      username: req.user.username,
      email: req.user.email,
      preferences: req.user.preferences, // optional
      // add other fields if needed
    });
  });
  

// router.route('/users/profile').post(ensureAuthenticated,updateUserProfile);
router.put('/profile', ensureAuthenticated,updateUserProfile);


module.exports=router;
