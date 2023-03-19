'use strict';

(function () {
  var amount = document.querySelector('#amount');
  var amountLabel = document.querySelector('label[for="amount"]');
  var form = document.querySelector('#payment-form');
  var clientToken = document.getElementById('client-token').innerText;

  amount.addEventListener(
    'focus',
    function () {
      amountLabel.className = 'has-focus';
    },
    false
  );
  amount.addEventListener(
    'blur',
    function () {
      amountLabel.className = '';
    },
    false
  ); 

  window.braintree.client.create({
    authorization: clientToken
  }, function (clientErr, clientInstance) {

    // Stop if there was a problem creating the client.
    // This could happen if there is a network error or if the authorization
    // is invalid.
    if (clientErr) {
      console.error('Error creating client:', clientErr);
      return;
    }
  
    // Create a PayPal Checkout component.
    window.braintree.paypalCheckout.create({
      client: clientInstance
    }, function (paypalCheckoutErr, paypalCheckoutInstance) {
      paypalCheckoutInstance.loadPayPalSDK({
        currency: 'USD',
        intent: 'capture'
      }, function () {
        var FUNDING_SOURCES = [
          paypal.FUNDING.PAYPAL,
          paypal.FUNDING.CREDIT,
          paypal.FUNDING.CARD
      ];

      // Loop over each funding source / payment method

  //FUNDING_SOURCES.forEach(function(fundingSource) {
  // Initialize the buttons
  var button = paypal.Buttons({
          //fundingSource: fundingSource,
          createOrder: function () {
            return paypalCheckoutInstance.createPayment({
              flow: 'checkout', // Required
              amount: 10.00, // Required
              currency: 'USD', // Required, must match the currency passed in with loadPayPalSDK
              intent: 'capture', // Must match the intent passed in with loadPayPalSDK
              enableShippingAddress: true,
              shippingAddressEditable: false,
              shippingAddressOverride: {
                recipientName: 'Scruff McGruff',
                line1: '1234 Main St.',
                line2: 'Unit 1',
                city: 'Chicago',
                countryCode: 'US',
                postalCode: '60652',
                state: 'IL',
                phone: '123.456.7890'
              }
            });
          },

          onApprove: function (data, actions) {
            return paypalCheckoutInstance.tokenizePayment(data, function (err, payload) {
              
              document.querySelector('#nonce').value = payload.nonce;
              console.log('nonce from paypal button ', payload.nonce); 
              form.submit();
              
            });
          },
  
          onCancel: function (data) {
            console.log('PayPal payment cancelled', JSON.stringify(data, 0, 2));
          },
  
          onError: function (err) {
            console.error('PayPal error', err);
          }
        }); 

        if (button.isEligible()) {
          // Render the standalone button for that funding source
        
        button.render('#paypal-button').then(function () {
          // The PayPal button will be rendered in an html element with the ID
          // `paypal-button`. This function will be called when the PayPal button
          // is set up and ready to be used
        });
      };
    
      //});
    
    });
  });
});

  window.braintree.dropin.create(
    {
      authorization: clientToken,
      container: '#bt-dropin',
      paypal: {
        flow: 'vault',
      },
    },
    function (createErr, instance) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        instance.requestPaymentMethod(function (err, payload) {
          if (err) {
            console.log('Error', err);

            return;
          }

          // Add the nonce to the form and submit
          document.querySelector('#nonce').value = payload.nonce;
          form.submit();
        });
      });
    });
})();
