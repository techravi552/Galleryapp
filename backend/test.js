const mongoose = require('mongoose');

const uri = 'mongodb+srv://ravikalmodiya23_db_user:YvnPihL1UOg2WFsG@cluster0.14btevb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });