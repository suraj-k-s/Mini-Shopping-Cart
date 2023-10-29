var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay');
var instance = new Razorpay({
  key_id: 'rzp_test_TvIdAJwuiVkT1E',
  key_secret: 'Pe5W2aVw54o0bji8bZ67VNjY',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {

      userData.Password = await bcrypt.hash(userData.Password, 10)
      db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
      console.log(data)
      console.log(data.ops[0])
        resolve(data.ops[0])
      })

    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({
        Email: userData.Email
      })
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("success");
            response.user = user
            response.status = true
            resolve(response)
          } else {
            console.log("failed");
            resolve({
              status: false
            })
          }
        })
      } else {
        console.log("failed");
        resolve({
          status: false
        })
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({
        user: objectId(userId)
      })
      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        console.log(proExist);
        if (proExist != -1) {
          db.get().collection(collection.CART_COLLECTION).updateOne({
            user: objectId(userId),
            "products.item": objectId(proId)
          }, {
            $inc: {
              'products.$.quantity': 1
            }
          }).then(() => {
            resolve()
          })
        } else {
          db.get().collection(collection.CART_COLLECTION).updateOne({
            user: objectId(userId)
          }, {
            $push: {
              products: proObj
            }
          }).then((response) => {
            resolve()
          })
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({
        user: objectId(userId)
      })
      if (userCart) {
        let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([{
            $match: {
              user: objectId(userId)
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
          }

        ]).toArray()
        resolve(cartItems)
      } else {
        resolve()
      }
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({
        user: objectId(userId)
      })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    });
  },
  removeCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION).updateOne({
        _id: objectId(details.cart)
      }, {
        $pull: {
          products: {
            item: objectId(details.product)
          }
        }
      }).then((response) => {
        resolve({
          removed: true
        })
      })
    })
  },
  changeProductQuantity: (details) => {
    count = parseInt(details.count)
    quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get().collection(collection.CART_COLLECTION).updateOne({
          _id: objectId(details.cart)
        }, {
          $pull: {
            products: {
              item: objectId(details.product)
            }
          }
        }).then((response) => {
          resolve({
            removeProduct: true
          })
        })
      } else {
        db.get().collection(collection.CART_COLLECTION).updateOne({
          _id: objectId(details.cart),
          "products.item": objectId(details.product)
        }, {
          $inc: {
            'products.$.quantity': count
          }
        }).then(() => {

          resolve({
            status: true
          })
        })
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([{
          $match: {
            user: objectId(userId)
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
        }

      ]).toArray()
      if (cartItems == 0) {
        let total = null

        resolve(total)
      } else {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([{
            $match: {
              user: objectId(userId)
            }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
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
          }, {
            $addFields: {
              Price: {
                $toInt: "$product.Price"
              },
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ['$quantity', '$Price']
                }
              }
            }
          }
        ]).toArray()
        resolve(total[0].total)
      }
    })
  },
  getTotalAmountPlaceOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([{
          $match: {
            user: objectId(userId)
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
        }

      ]).toArray()
      if (cartItems == 0) {

      } else {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([{
            $match: {
              user: objectId(userId)
            }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
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
          }, {
            $addFields: {
              Price: {
                $toInt: "$product.Price"
              },
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ['$quantity', '$Price']
                }
              }
            }
          }
        ]).toArray()
        resolve(total[0].total)
      }
    })
  },
  placeOrder: (order, products, total) => {
    return new Promise(function(resolve, reject) {
      console.log(order, products, total);
      let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode
        },
        userId: objectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmount: total,
        date: new Date(),
        status: status
      }

      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collection.CART_COLLECTION).removeOne({
          user: orderObj.userId
        })
        resolve(response.ops[0]._id)
      })
    });;
  },
  getCartProductlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({
        user: objectId(userId)
      })
      resolve(cart.products)
    });
  },
  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({
        userId: objectId(userId)
      }).toArray()
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
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        "amount": total*100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "receipt": "" + orderId,
      };
      instance.orders.create(options, function(err, order) {
        resolve(order)
      })
    });
  },
  verifyPayment: (details) => {
    return new Promise(async (resolve, reject) => {
      const {
        createHmac
      } = await import('node:crypto');
      let hmac = createHmac('sha256', 'Pe5W2aVw54o0bji8bZ67VNjY');
      hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex')
      if (hmac == details['payment[razorpay_signature]']) {
        resolve()
      } else {
        reject()
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({
          _id: objectId(orderId)
        }, {
          $set: {
            status: 'placed'
          }
        }).then(() => {
          resolve()
        })
    });
  }
}
