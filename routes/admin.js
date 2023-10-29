var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var fsextra = require('fs-extra')
var path = require('path')
var adminHelper = require('../helpers/admin-helper')
var verifyAdmin = (req,res,next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}

router.get('/',verifyAdmin, function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    products.reverse()
    res.render('admin/view-products', {products,admin:true,adminLogged:req.session.admin});
  })

});

router.get('/add-product',verifyAdmin,(req,res)=>{
  res.render('admin/add-product',{admin:true,adminLogged:req.session.admin})
})

router.post('/add-product',(req,res)=>{
req.body.date= Date(),

  productHelper.addProduct(req.body,(id)=>{
      console.log(req.body);
      let image = req.files.Image
      image.mv('./public/images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.render("admin/add-product")
        }else {
          console.log(err);
        }
      })
  })

})


router.get('/delete-product:id',function (req,res) {
  let proId=req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id',verifyAdmin,async(req,res)=> {
  let product = await productHelper.getProductDetails(req.params.id)
    res.render('admin/edit-product',{product,admin:true,adminLogged:req.session.admin})

})

router.post('/edit-product/:id',(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/images/'+req.params.id+'.jpg',(err,done)=>{

      })
    }
  })
})

router.get('/orders',verifyAdmin,async(req,res)=>{
  let orders=await productHelper.getAllOrder()
  orders.reverse()
    res.render('admin/orders',{orders,admin:true,adminLogged:req.session.admin})
})

router.get('/view-order-product/:id',verifyAdmin,async(req,res)=>{
  let orderItems=await productHelper.getOrderProduct(req.params.id)
  res.render('admin/view-order-products',{orderItems,admin:true,adminLogged:req.session.admin})
})

router.get('/update-order-status/:id',verifyAdmin,async(req,res)=> {
  let order = await productHelper.getOrderStatus(req.params.id)
  let orderProduct=order[0]
  let orderItems=await productHelper.getOrderProduct(orderProduct._id)
    res.render('admin/update-status',{orderProduct,orderItems,admin:true,adminLogged:req.session.admin})

})

router.post('/update-order-status/:id',(req,res)=>{
  productHelper.updateStatus(req.params.id,req.body).then(()=>{
    res.redirect('/admin/orders')
  })
})

router.get('/login', function(req,res) {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {

    res.render('admin/login', {
      "loginErr": req.session.adminLoginErr
    })
    req.session.adminLoginErr = null
  }
})

router.post('/login', function(req,res) {
  adminHelper.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.user
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = "Invaild Email or Password"
      res.redirect('/admin/login')
    }
  })
})

/*
router.get('/signup', function(req,res) {
  if (req.session.adminLoggedIn) {
    res.redirect('/')
  } else {
    res.render('admin/signup')
  }

})

router.post('/signup', function(req,res) {
  adminHelper.adminSignup(req.body).then((response) => {
    req.session.adminLoggedIn = true
    req.session.admin = response
    res.redirect('admin/')

  })
}) */

router.get('/logout', (req,res) => {
  req.session.destroy()
  res.redirect('/admin/login')
})
module.exports = router;
