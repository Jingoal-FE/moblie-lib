
var util = require('common/util'); 

describe("A suite of basic functions", function() {
    it("util",function(){
        // expect('DCBA').toEqual(func('ABCD'));

        // Test data
        var obj = {key: 123};

        expect('{key: 123}')
            .toEqual(
                util.JSON(obj)
            );

        expect('{key: 1234}')
            .toEqual(
                util.JSON(obj)
            );
    });
});
