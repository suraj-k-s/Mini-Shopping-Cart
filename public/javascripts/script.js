function addToCart(proId) {
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
          let count=$('#cart-count').html()
          count=parseInt(count)+1
          $("#cart-count").html(count)
        }

      }
    })
  }


  function changeQuantity(cartId,proId,userId,count) {
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    $.ajax({
      url:'/change-product-quantity',
      data:{
        user:userId,
        cart:cartId,
        product:proId,
        count:count,
        quantity:quantity
      },
      method:'post',
      success:(response)=>{
        if (response.removeProduct) {
          alert("Product Removed From Cart")
          location.reload()
        }else{
          document.getElementById(proId).innerHTML=quantity+count
          document.getElementById('total').innerHTML=response.total
        }
      }
    })
  }

  function removeCart(cartId,proId) {
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    $.ajax({
      url:'/removecart',
      data:{
        cart:cartId,
        product:proId,
      },
      method:'post',
      success:(response)=>{
        if(response.removed){
        alert("Product Removed From Cart")
        location.reload()
      }
      }
    })
  }
