// Supabase configuration
const SUPABASE_URL = 'https://hgomngtjbiopxvcttprn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qLh8Nmyqwr3npRy2xKhOiw_5OQ-i1k2';

let db;
let supabaseReady = false;

try {
    if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('...')) {
        throw new Error('Please paste the FULL publishable key from Supabase dashboard');
    }
    
    db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    supabaseReady = true;
    console.log('✅ Supabase initialized');
} catch (error) {
    console.error('❌ Supabase init failed:', error.message);
    db = null;
    supabaseReady = false;
}

function isSupabaseReady() {
    return supabaseReady;
}

async function getOrCreateClient(clientData) {
    if (!db) return null;
    
    try {
        const { data: existing } = await db
            .from('clients')
            .select('id')
            .eq('email', clientData.email)
            .limit(1);
            
        if (existing && existing.length > 0) {
            return existing[0].id;
        }
        
        const { data: newClient, error } = await db
            .from('clients')
            .insert([{
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone || null
            }])
            .select();
            
        if (error) throw error;
        return newClient[0].id;
        
    } catch (error) {
        console.error('Client error:', error.message);
        return null;
    }
}

const dbHelpers = {
    async saveBooking(bookingData) {
        if (!db) {
            return { success: true, demo: true };
        }
        
        try {
            const clientId = await getOrCreateClient({
                name: bookingData.first + ' ' + bookingData.last,
                email: bookingData.email,
                phone: bookingData.phone
            });
            
            if (!clientId) throw new Error('Could not create client');
            
            const { data, error } = await db
                .from('bookings')
                .insert([{
                    client_id: clientId,
                    service: bookingData.service,
                    price: bookingData.price,
                    date: bookingData.date,
                    time: bookingData.time,
                    notes: bookingData.notes || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();
                
            if (error) throw error;
            return { success: true, data };
            
        } catch (error) {
            console.error('Booking error:', error.message);
            return { success: false, error: error.message };
        }
    },
    
    async getBookings() {
        if (!db) return { success: false, error: 'Not connected' };
        
        try {
            const { data, error } = await db
                .from('bookings')
                .select('*, clients(name, email, phone)')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateBookingStatus(bookingId, status) {
        if (!db) return { success: false, error: 'Not connected' };
        
        try {
            const { data, error } = await db
                .from('bookings')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', bookingId);
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

window.db = db;
window.dbHelpers = dbHelpers;
window.isSupabaseReady = isSupabaseReady;