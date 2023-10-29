var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID

module.exports = {
  addProduct: (product, callback) => {

    db.get().collection('product').insertOne(product).then((data) => {
      callback(data.ops[0]._id)
    })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  },
  deleteProduct:(proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
        resolve(response)
      })
    })
  },
  detailProduct:(proid)=>{
    return new Promise((resolve, reject)=>{
      let o_id = new objectId(proid)
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: o_id}).then((response)=>{

        resolve (response)
      })

    });
  },
  getProductDetails:(proId)=>{
  return new Promise((resolve, reject)=> {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
        resolve (product)
      })
    });
  },
  updateProduct:(proId,proDetails)=>{
    return new Promise((resolve, reject)=> {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
        $set:{
          Name:proDetails.Name,
          Description:proDetails.Description,
          price:proDetails.Price,
          Category:proDetails.Category,
          date:Date()
        }
      }).then((response)=>{
        resolve()
      })
    });
  },
  getAllOrder: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
      if (orders) {
        resolve(orders)
      } else {
        orders = null
        resolve(orders)
      }
    });
  },
  getOrderProduct: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
        $match: {
          _id: objectId(orderId)
        }
      }, {

        $unwind: '$products'

      }, {
        $project: {
          item: '$products.item',
          quantity: '$products.quantity'
        }
      }, {
        $lookup: {
          from: collection.PRODUCT_COLLECTION,
          localField: 'item',
          foreignField: '_id',
          as: 'product'
        }
      }, {
        $project: {
          item: 1,
          quantity: 1,
          product: {
            $arrayElemAt: ['$product', 0]
          }
        }
      }]).toArray()
      resolve(orderItems)
    });
  },
  getOrderStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({
        _id: objectId(orderId)
      }).toArray()
      if (orders) {
        resolve(orders)
      } else {
        orders = null
        resolve(orders)
      }
    });
  },
  updateStatus:(orderId,update)=>{
    return new Promise((resolve, reject)=> {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
        $set:{
          status:update.status
        }
      }).then((response)=>{
        resolve()
      })
    });
  }
}
