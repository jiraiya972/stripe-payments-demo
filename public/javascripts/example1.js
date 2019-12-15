(async () => {
    'use strict';

    // Retrieve the configuration from the API.
    const getConfig = async () => {
        try {
          const response = await fetch('/config');
          const config = await response.json();
          if (config.stripePublishableKey.includes('live')) {
              // Hide the demo notice if the publishable key is in live mode.
              document.querySelector('#order-total .demo').style.display = 'none';
          }
          
          //add query param information to config
          var parsedUrl = new URL(window.location.href);
          config.transactionId = parsedUrl.searchParams.get('tid');
          config.transactionAmount = parseFloat(parsedUrl.searchParams.get('tamount'));

          if(!config.transactionId || !config.transactionAmount) {
            throw new Error('mising param Amount or transaction Id');
          }

          return config;
        } catch (err) {
          console.error({error: err.message});
          throw new Error(err);
        }
    }

    // Retrieve the configuration for the store.
    window.config = await getConfig();

    // Create a Stripe client.
    window.stripe = Stripe(config.stripePublishableKey);

    var elements = stripe.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css?family=Roboto',
        },
      ],
      // Stripe's examples are localized to specific languages, but if
      // you wish to have Elements automatically detect your user's locale,
      // use `locale: 'auto'` instead.
      locale: 'auto'
    });
  
    var card = elements.create('card', {
      iconStyle: 'solid',
      style: {
        base: {
          iconColor: '#c4f0ff',
          color: '#fff',
          fontWeight: 500,
          fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
          fontSize: '16px',
          fontSmoothing: 'antialiased',
  
          ':-webkit-autofill': {
            color: '#fce883',
          },
          '::placeholder': {
            color: '#87BBFD',
          },
        },
        invalid: {
          iconColor: '#FFC7EE',
          color: '#FFC7EE',
        },
      },
    });
    card.mount('#example1-card');

    // Create the payment request.
    const paymentRequest = stripe.paymentRequest({
      country: config.stripeCountry,
      currency: config.currency,
      total: {
        label: 'Total',
        amount: config.transactionAmount,
      },
      requestShipping: true,
      requestPayerEmail: true,
      shippingOptions: config.shippingOptions,
    });

    // Create the Payment Request Button.
    const paymentRequestButton = elements.create('paymentRequestButton', {
      paymentRequest,
    });

    // Callback when a payment method is created.
    paymentRequest.on('paymentmethod', async event => {
      // Confirm the PaymentIntent with the payment method returned from the payment request.
      const {error} = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: event.paymentMethod.id,
          shipping: {
            name: event.shippingAddress.recipient,
            phone: event.shippingAddress.phone,
            address: {
              line1: event.shippingAddress.addressLine[0],
              city: event.shippingAddress.city,
              postal_code: event.shippingAddress.postalCode,
              state: event.shippingAddress.region,
              country: event.shippingAddress.country,
            },
          },
        },
        {handleActions: false}
      );
      if (error) {
        // Report to the browser that the payment failed.
        event.complete('fail');
        handlePayment({error});
      } else {
        // Report to the browser that the confirmation was successful, prompting
        // it to close the browser payment method collection interface.
        event.complete('success');
        // Let Stripe.js handle the rest of the payment flow, including 3D Secure if needed.
        const response = await stripe.confirmCardPayment(
          paymentIntent.client_secret
        );
        handlePayment(response);
      }
    });

    // Check if the Payment Request is available (or Apple Pay on the Web).
    const paymentRequestSupport = await paymentRequest.canMakePayment();
    if (paymentRequestSupport) {
      // Display the Pay button by mounting the Element in the DOM.
      paymentRequestButton.mount('#payment-request-button');
      // Replace the instruction.
      document.querySelector('.instruction span').innerText = 'Or enter';
      // Show the payment request section.
      document.getElementById('payment-request').classList.add('visible');
      console.log('test if paymentReqSupport');
      
    }
  
    registerElements([card], 'example1');
  })();