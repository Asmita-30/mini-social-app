const mongoose = require('mongoose');

async function test() {
  console.log('🔍 Testing MongoDB Atlas connection with your credentials...\n');
  
  // Your connection string with URL-encoded password
  const uri = 'mongodb+srv://socialapp_user:Social%40123@socialapp.dvzkld8.mongodb.net/social_app?retryWrites=true&w=majority&appName=Socialapp';
  
  console.log('Connection string (hidden password):');
  console.log(uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
  console.log('\nPassword is URL-encoded: @ → %40');
  
  try {
    console.log('🔗 Connecting...');
    await mongoose.connect(uri);
    
    console.log('\n✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🏢 Host: ${mongoose.connection.host}`);
    
    // Create a test collection
    const Test = mongoose.model('TestConnection', new mongoose.Schema({ 
      name: String,
      timestamp: { type: Date, default: Date.now }
    }));
    
    // Create test document
    const testDoc = await Test.create({ name: 'Connection Test - Social App' });
    console.log(`✅ Created test document: ${testDoc._id}`);
    
    // Read it back
    const foundDoc = await Test.findById(testDoc._id);
    console.log(`✅ Found document: ${foundDoc.name}`);
    
    // Clean up
    await Test.deleteOne({ _id: testDoc._id });
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 MongoDB Atlas is working perfectly!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔐 Possible issues:');
      console.log('1. Check password encoding: Social@123 → Social%40123');
      console.log('2. User "socialapp_user" exists in MongoDB Atlas');
      console.log('3. User has "readWriteAnyDatabase" role');
      console.log('4. Network Access allows all IPs (0.0.0.0/0)');
    }
    
    process.exit(1);
  }
}

test();