const mongoose = require('mongoose');

async function test() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  // Use your actual connection string
  const uri = 'mongodb+srv://socialapp_user:SocialApp123@socialapp.dvzkld8.mongodb.net/social_app?retryWrites=true&w=majority&appName=Socialapp';
  
  console.log('Connection URL (hidden password):');
  console.log(uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
  console.log('');
  
  try {
    // Test with Mongoose
    console.log('🔗 Connecting with Mongoose...');
    await mongoose.connect(uri);
    console.log('✅ Mongoose connected successfully!');
    
    // Create test collection and document
    const Test = mongoose.model('Test', new mongoose.Schema({ 
      name: String, 
      timestamp: { type: Date, default: Date.now } 
    }));
    
    const testDoc = await Test.create({ name: 'Connection Test' });
    console.log(`✅ Created test document: ${testDoc._id}`);
    
    // Read it back
    const foundDoc = await Test.findById(testDoc._id);
    console.log(`✅ Found document: ${foundDoc.name}`);
    
    // Clean up
    await Test.deleteOne({ _id: testDoc._id });
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 ALL TESTS PASSED! Your MongoDB Atlas is working perfectly!');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.log('\n🔐 AUTHENTICATION ISSUE:');
      console.log('Please check in MongoDB Atlas:');
      console.log('1. Go to Database Access');
      console.log('2. Find user "socialapp_user"');
      console.log('3. Click "Edit"');
      console.log('4. Set Built-in Role to "readWriteAnyDatabase"');
      console.log('5. Save and wait 2 minutes');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 NETWORK ISSUE:');
      console.log('1. Check your internet connection');
      console.log('2. The cluster might not exist');
    }
    
    process.exit(1);
  }
}

test();