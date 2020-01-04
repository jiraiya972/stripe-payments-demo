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

          if(!config.transactionId) {
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

    registerElements([card], 'example1');
  })();