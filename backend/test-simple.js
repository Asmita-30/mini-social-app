const { MongoClient } = require('mongodb');

async function test() {
  console.log('🔍 Testing MongoDB Connection (Native Driver)...\n');
  
  const uri = 'mongodb+srv://socialapp_user:SocialApp123@socialapp.dvzkld8.mongodb.net/?retryWrites=true&w=majority&appName=Socialapp';
  
  console.log('Connection URL (hidden password):');
  console.log(uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('\n✅ SUCCESS: Connected to MongoDB!');
    
    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log('\n📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
    // Try to use social_app database
    const db = client.db('social_app');
    console.log(`\n📁 Using database: ${db.databaseName}`);
    
    // Create a test collection
    const collection = db.collection('test_connection');
    await collection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Created test document');
    
    // Count documents
    const count = await collection.countDocuments();
    console.log(`✅ Documents in test_connection: ${count}`);
    
    // Clean up
    await collection.deleteMany({ test: true });
    console.log('✅ Cleaned up test documents');
    
    console.log('\n🎉 MongoDB Atlas is working perfectly!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔐 The user "socialapp_user" needs proper permissions:');
      console.log('1. Go to MongoDB Atlas → Database Access');
      console.log('2. Find "socialapp_user"');
      console.log('3. Click "Edit"');
      console.log('4. Add Built-in Role: "readWriteAnyDatabase"');
      console.log('5. Save and wait 2 minutes');
    }
    
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

test();