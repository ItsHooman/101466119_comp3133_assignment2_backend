const {
    GraphQLObjectType, GraphQLString, GraphQLID, GraphQLInt,
    GraphQLSchema, GraphQLList, GraphQLNonNull
  } = require('graphql');
  const User = require('../models/User');
  const Employee = require('../models/Employee');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  
  // User Type
  const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: GraphQLID },
      username: { type: GraphQLString },
      email: { type: GraphQLString },
      created_at: { type: GraphQLString }
    })
  });
  
  // Employee Type (adapted to frontend field names)
  const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    fields: () => ({
      id: { type: GraphQLID },
      name: {
        type: GraphQLString,
        resolve: emp => `${emp.first_name} ${emp.last_name}`
      },
      email: { type: GraphQLString },
      gender: { type: GraphQLString },
      position: {
        type: GraphQLString,
        resolve: emp => emp.designation
      },
      salary: { type: GraphQLInt },
      date_of_joining: { type: GraphQLString },
      department: { type: GraphQLString },
      profilePicture: {
        type: GraphQLString,
        resolve: emp => emp.employee_photo
      }
    })
  });
  
  // Login Response
  const LoginType = new GraphQLObjectType({
    name: 'LoginResponse',
    fields: () => ({
      token: { type: GraphQLString },
      user: { type: UserType }
    }),
  });
  
  // Root Query
  const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      users: {
        type: new GraphQLList(UserType),
        resolve() {
          return User.find();
        }
      },
      employees: {
        type: new GraphQLList(EmployeeType),
        resolve() {
          return Employee.find();
        }
      },
      employee: {
        type: EmployeeType,
        args: { id: { type: GraphQLNonNull(GraphQLID) } },
        resolve(_, { id }) {
          return Employee.findById(id);
        }
      },
      searchEmployeeByDesignationOrDepartment: {
        type: new GraphQLList(EmployeeType),
        args: {
          designation: { type: GraphQLString },
          department: { type: GraphQLString }
        },
        resolve(_, args) {
          const query = {};
          if (args.designation) query.designation = args.designation;
          if (args.department) query.department = args.department;
          return Employee.find(query);
        }
      },
      login: {
        type: LoginType,
        args: {
          email: { type: GraphQLNonNull(GraphQLString) },
          password: { type: GraphQLNonNull(GraphQLString) }
        },
        async resolve(_, { email, password }) {
          const user = await User.findOne({ email });
          if (!user) throw new Error('User not found');
  
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) throw new Error('Invalid credentials');
  
          const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
          return { token, user };
        }
      }
    }
  });
  
  // Mutations
  const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      signup: {
        type: UserType,
        args: {
          username: { type: GraphQLNonNull(GraphQLString) },
          email: { type: GraphQLNonNull(GraphQLString) },
          password: { type: GraphQLNonNull(GraphQLString) }
        },
        async resolve(_, { username, email, password }) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = new User({ username, email, password: hashedPassword });
          return user.save();
        }
      },
      addEmployee: {
        type: EmployeeType,
        args: {
          first_name: { type: GraphQLNonNull(GraphQLString) },
          last_name: { type: GraphQLNonNull(GraphQLString) },
          email: { type: GraphQLNonNull(GraphQLString) },
          gender: { type: GraphQLNonNull(GraphQLString) },
          designation: { type: GraphQLNonNull(GraphQLString) },
          salary: { type: GraphQLNonNull(GraphQLInt) },
          date_of_joining: { type: GraphQLNonNull(GraphQLString) },
          department: { type: GraphQLNonNull(GraphQLString) },
          employee_photo: { type: GraphQLString }
        },
        resolve(_, args) {
          const employee = new Employee(args);
          return employee.save();
        }
      },
      updateEmployee: {
        type: EmployeeType,
        args: {
          id: { type: GraphQLNonNull(GraphQLID) },
          first_name: { type: GraphQLString },
          last_name: { type: GraphQLString },
          email: { type: GraphQLString },
          gender: { type: GraphQLString },
          designation: { type: GraphQLString },
          salary: { type: GraphQLInt },
          date_of_joining: { type: GraphQLString },
          department: { type: GraphQLString },
          employee_photo: { type: GraphQLString }
        },
        async resolve(_, { id, ...fields }) {
          const employee = await Employee.findByIdAndUpdate(
            id,
            { $set: fields },
            { new: true, runValidators: true }
          );
          if (!employee) throw new Error('Employee not found');
          return employee;
        }
      },
      deleteEmployee: {
        type: GraphQLString,
        args: { id: { type: GraphQLNonNull(GraphQLID) } },
        async resolve(_, { id }) {
          const employee = await Employee.findByIdAndDelete(id);
          if (!employee) throw new Error('Employee not found');
          return 'Employee deleted successfully';
        }
      }
    }
  });
  
  module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
  });
  