'use strict';


function test() {
  try {
    throw new Error('xxx')
    return 'aaa';
  
  } finally {
    console.log('bbb');
  }
}

console.log(test());