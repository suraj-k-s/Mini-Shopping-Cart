var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID

module.exports = {
  /*
  adminSignup: (userData) => {
    return new Promise(async (resolve, reject) => {

      userData.Password = await bcrypt.hash(userData.Password, 10)
      db.get().collection(collection.ADMIN).insertOne(userData).then((data) => {
        resolve(data.ops[0])
      })

    })
  },
  adminLogin: (userData) => {
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
  },*/
  adminLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let adminOrgaccount={
        Name:'Anson Benny',
        email:'ansonbenny16@gmail.com',
        password:'1234'
      }
      if(userData.Email===adminOrgaccount.email && userData.Password===adminOrgaccount.password){
        console.log("success");
        response.user = adminOrgaccount
        response.status = true
        resolve(response)
      }else {
        console.log("failed");
        resolve({
          status: false
        })
      }
    });
  }
}
