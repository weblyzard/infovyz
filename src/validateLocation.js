import { default as av } from 'avocado-type-checker/build/avocado_es';

av.type('latitude', function(d) {
  var l = av('float')(d)();
  if (l < -90 || l > 90) {
    throw new Error('latitude must be a number between -90 and 90.');
  }
  return d;
});

av.type('longitude', function (d){
  var l = av('float')(d)();
  if (l < -180 || l > 180) {
    throw new Error('longitude must be a number between -180 and 180.');
  }
  return d;
});

av.type('location', {
  id: 'string',
  // commented for now because examples use data without values
  // and avocado doesn't support optional attributes yet.
  // value: 'int',
  longitude: 'longitude',
  latitude: 'latitude'
});

export default av;

