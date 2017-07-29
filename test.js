const assert = require('assert');

const publicId = require('.');
const {PublicIdGenerator} = publicId;

describe('publicId', function() {
  describe('[call]()', function() {
    it('should throw a TypeError', function() {
      assert.throws(() => {
        publicId();
      }, TypeError);
    });
  });
  
  describe('[call](19)', function() {
    it('should return a string', async function() {
      const result = await publicId(19);
      assert.equal(typeof result, 'string');
      assert.equal(result.length, 8);
    });
  });
  
  describe('[call](19, 8, [0.3, 0.5])', function() {
    it('should return a specific string', async function() {
      const result = await publicId(19, 8, [0.3, 0.5]);
      // assert.equal(typeof result, 'string');
      assert.strictEqual(result, 'ivUVjy0Q');
    });
  });
  
  describe('[call](\'ivUVjy0Q\')', function() {
    it('should return 19', async function() {
      const result = await publicId('ivUVjy0Q');
      // assert.equal(typeof result, 'number');
      assert.strictEqual(result, 19);
    });
  });
  
  describe('#maxId()', function() {
    it('should return 56800235584', function() {
      assert.equal(publicId.maxId(), 56800235584);
    });
  });
  
  describe('[call](56800235584)', function() {
    it('should return a string', async function() {
      const result = await publicId(56800235584);
      assert.equal(typeof result, 'string');
      assert.equal(result.length, 8);
    });
  });
  
  describe('[call](56800235585)', function() {
    it('should throw a RangeError', async function() {
      try {
        await publicId(56800235585);
        assert.fail();
      } catch(error) {
        assert.ok(error instanceof RangeError);
      }
    });
  });
  
  describe('#configure()', function() {
    describe('defaultIdLength = 11', function() {
      before(function() {
        publicId.configure({defaultIdLength: 11});
      });
      after(function() {
        publicId.resetConfiguration();
      });
      
      it('should return a string of length 11', async function() {
        publicId.configure({defaultIdLength: 11});
        
        const result = await publicId(19);
        assert.equal(typeof result, 'string');
        assert.equal(result.length, 11);
      });
    });
    
    describe('randomFunction', function() {
      before(function() {
        const randomValues = [0.3, 0.5];
        const randomFunction = async function() {
          return randomValues.shift();
        };
        
        publicId.configure({randomFunction});
      });
      after(function() {
        publicId.resetConfiguration();
      });
      
      it('should return a specific string', async function() {
        const result = await publicId(19);
        // assert.equal(typeof result, 'string');
        assert.strictEqual(result, 'ivUVjy0Q');
      });
    });
  });
});

describe('PublicIdGenerator', function() {
  let generator;
  
  before(function() {
    generator = new PublicIdGenerator({defaultIdLength: 12});
  });
  
  describe('#generate(19)', function() {
    it('should return a string of length 12', async function() {
      const result = await generator.generate(19);
      assert.equal(typeof result, 'string');
      assert.equal(result.length, 12);
    });
  });
});
