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

  var venmoButton = document.getElementById('venmo-button');

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
          paypal.FUNDING.VENMO,
          paypal.FUNDING.CARD
      ];

      // Loop over each funding source / payment method

  //FUNDING_SOURCES.forEach(function(fundingSource) {
  // Initialize the buttons
  var button = paypal.Buttons({
          //fundingSource: 'venmo', //'fundingSource',
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

 
  
  window.braintree.dataCollector.create({
      client: clientInstance,
      paypal: true
    }, function (dataCollectorErr, dataCollectorInstance) {
      if (dataCollectorErr) {
        // Handle error in creation of data collector.
        return;
      }
  
      // At this point, you should access the deviceData value and provide it
      // to your server, e.g. by injecting it into your form as a hidden input.
      console.log('Got device data:', dataCollectorInstance.deviceData);
    });
  
    console.log('creating venmo button'); 

    /** 
   window.braintree.venmo.create({
      client: clientInstance,
      allowDesktop: true,
      // allowDesktopWebLogin: true,
      profileId: '1953896702662410263',
      paymentMethodUsage: 'single_use',
      // mobileWebFallBack: true, // available in v3.77.0+
      // Add allowNewBrowserTab: false if your checkout page does not support
      // relaunching in a new tab when returning from the Venmo app. This can
      // be omitted otherwise.
      // allowNewBrowserTab: false
    }, function (venmoErr, venmoInstance) {
      if (venmoErr) {
        console.error('Error creating Venmo:', venmoErr);
        return;
      }
  
      // Verify browser support before proceeding.
      if (!venmoInstance.isBrowserSupported()) {
        console.log('Browser does not support Venmo');
        return;
      }
  
      console.log("Trying to display venmo button");
      displayVenmoButton(venmoInstance);
  
      // Check if tokenization results already exist. This occurs when your
      // checkout page is relaunched in a new tab. This step can be omitted
      // if allowNewBrowserTab is false.
      if (venmoInstance.hasTokenizationResult()) {
        venmoInstance.tokenize(function (tokenizeErr, payload) {
          if (err) {
            handleVenmoError(tokenizeErr);
          } else {
            handleVenmoSuccess(payload);
          }
        });
        return;
      }
    });
 */

  window.braintree.dropin.create(
    {
      authorization: clientToken,
      container: '#bt-dropin',
      paypal: {
        flow: 'vault',
      },
      venmo: {
        allowDesktop: true,
        paymentMethodUsage: "multi_use"
        //profileId: "1953896702662410263"
      }
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
  }); 


  function displayVenmoButton(venmoInstance) {

    console.log('venmo button - displayVenmoButton Function');

    // Assumes that venmoButton is initially display: none.
    venmoButton.style.display = 'block';
  
    venmoButton.addEventListener('click', function () {
      venmoButton.disabled = true;
  
      venmoInstance.tokenize(function (tokenizeErr, payload) {
        venmoButton.removeAttribute('disabled');
  
        if (tokenizeErr) {
          handleVenmoError(tokenizeErr);
        } else {
          handleVenmoSuccess(payload);
        }
      });
    });
  }


function handleVenmoError(err) {
  if (err.code === 'VENMO_CANCELED') {
    console.log('App is not available or user aborted payment flow');
  } else if (err.code === 'VENMO_APP_CANCELED') {
    console.log('User canceled payment flow');
  } else {
    console.error('An error occurred:', err.message);
  }
}

function handleVenmoSuccess(payload) {
  // Send the payment method nonce to your server, e.g. by injecting
  // it into your form as a hidden input.
  console.log('Got a payment method nonce:', payload.nonce);
  // Display the Venmo username in your checkout UI.
  console.log('Venmo user:', payload.details.username);
}


})();
