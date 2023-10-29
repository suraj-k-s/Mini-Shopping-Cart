var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helpers')
const verifyLogin = (req,res,next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req,res,next) {
  let user = req.session.user;
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  productHelper.getAllProducts().then((products) => {
    products.reverse()
    res.render('user/view-products', {
      products,
      user,
      cartCount
    });
  })
});

router.get('/login', function(req,res) {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {

    res.render('user/login', {
      "loginErr": req.session.userLoginErr
    })
    req.session.userLoginErr = null
  }
})

router.get('/signup', function(req,res) {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup')
  }

})

router.post('/signup', function(req,res) {
  userHelper.doSignup(req.body).then((response) => {
    req.session.userLoggedIn = true
    req.session.user = response
    res.redirect('/')

  })
})

router.post('/login', function(req,res) {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invaild Email or Password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/login')
})

router.get('/cart', verifyLogin, async function(req,res) {
    let total=await userHelper.getTotalAmount(req.session.user._id)
    let products = await userHelper.getCartProducts(req.session.user._id).then((products) => {
    console.log(products);
    res.render('user/cart', {
      products,
      total,
      user: req.session.user
    })
  })
})

router.get('/product', function(req,res) {
  let proid = req.query.id
  console.log(proid);
  productHelper.detailProduct(proid).then((response) => {
    console.log(response);
    res.render('user/product-detail', {
      response,user:req.session.user
    })
  })
})

router.get('/add-to-cart/:id', (req,res) => {
  console.log('api called');
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    //res.redirect('/')
    res.json({
      status: true
    })
  })
})

router.post('/change-product-quantity',(req,res,next) => {
  userHelper.changeProductQuantity(req.body).then(async(response) => {
    response.total=await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/removecart', (req,res,next) => {
  userHelper.removeCartProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/place-order', verifyLogin,async(req,res)=>{
  let total=await userHelper.getTotalAmountPlaceOrder(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products=await userHelper.getCartProductlist(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmountPlaceOrder(req.session.user._id)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }

  })
})

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success')
})

router.get('/orders',verifyLogin,async(req,res)=>{
  userId=req.session.user._id
  let orders=await userHelper.getUserOrder(userId)
  orders.reverse()
    res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-order-product/:id',verifyLogin,async(req,res)=>{
  let orderItems=await userHelper.getOrderProduct(req.params.id)
  console.log(orderItems);
  res.render('user/view-order-products',{user:req.session.user,orderItems})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    }).catch((err)=>{
      console.log(err);
      res.json({status:false,errMSg:''})
    })
  })
})
module.exports = router;
