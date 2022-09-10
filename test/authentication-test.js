//? Import whatever we want to test
const authMiddleware = require('../util/is-auth.js');

//? Import Chai to set expectations about test results
//! We don't import mocha because we already run Mocha with "npm test"
//! and then mocha runs itself looking for a "test" folder and then runs
//! all files within that folder.
const expect = require('chai').expect;

//? Write what the test name is and what it should run as the function
//? on the second parameter of "it()"
it('should throw an error if no authorization token is present', () => {
	//? Define what variables are necessary to test this function.
	//? In this case, we are testing how the authorization middleware
	//? handles a request that doesn't return a proper "Authorization"
	//? header as expected
	const req = {
		//? We define a "get" method to this object, since the authorization
		//? middleware checks for "req.get('Authorization')"
		get: function (headerName) {
			//? We return null because we are purposefully testing for
			//? an unauthorized request
			return null;
		},
	};

	//? Now we write our expectations with this test using Chai
	expect(
		//? We can't directly call the function, else the test will fail.
		//? What we do instead is binding the function as a parameter of
		//? "expect()" so it can run our function for us. When binding,
		//? you need to pass the function ("this") as first argument, then
		//? the rest of the arguments afterwards
		authMiddleware.bind(
			this,
			//? Since "authMiddleware" expects 3 arguments, we pass then
			//? after "bind". In order: req, res, next. Since we are
			//? expected to fail the test, we pass the other arguments
			//? as empty object or function
			req,
			{},
			() => {}
		)
	)
		//? After setting up the function to be tested, we write
		//? what we expect to come out of the function. In this case,
		//? we are clearly defining that we "expect" this function
		//? "to throw" and error message that is perfectly equal (===)
		//? to the exact message "Not authenticated."
		.to.throw('Not authenticated.');
	//? We can now run this test with "mocha" on the console and
	//? the test should pass as the authorization middleware will
	//? throw the error as expected
});
