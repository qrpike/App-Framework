
"use strict";
describe('Blank testing template..', function(){

	// Create a widget to test against:
	beforeEach(function(){
		this.something = {};
	});


	// Destroy the old test widget:
	afterEach(function(){
		delete this.something;
	});


	/*
		BEGIN THE TESTS:
		----------------------------------
	*/

	// Check the Module:
	it('should be a object', function (){
		this.something.should.be.a( 'object' );
	});


});