require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const connectDB = require('./config/db');
const schema = require('./graphql/schema');

const app = express();
connectDB();

app.use(cors()); // ✅ Allow frontend access

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
