// Stripe Payment Integration
// Replace with your actual Stripe publishable key

const STRIPE_KEY = 'pk_test_your_key_here';

// Initialize Stripe
// const stripe = Stripe(STRIPE_KEY);

const payment = {
    // Create a payment intent on your backend
    async createPaymentIntent(bookingData) {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 2000,
                    currency: 'aud',
                    booking_id: bookingData.id
                })
            });

            const { clientSecret } = await response.json();
            return { success: true, clientSecret };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            return { success: false, error: error.message };
        }
    },

    async requestBookingBond(bookingData) {
        console.log('Bond payment requested:', bookingData);

        const btn = document.querySelector('.submit-btn');
        btn.disabled = false;
        btn.textContent = 'Pay $20 Bond & Confirm Appointment';

        document.getElementById('confirmation').classList.remove('hidden');
        document.getElementById('confirmation-details').innerHTML = 
            '<strong>' + bookingData.service + '</strong><br>' +
            bookingData.date + ' at ' + bookingData.time + '<br>' +
            bookingData.first + ' ' + bookingData.last;

        window.scrollTo(0, document.body.scrollHeight);
    }
};

window.payment = payment;
window.requestBookingBond = payment.requestBookingBond;