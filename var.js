const data = { 'title': 'test item' };
const exp = `todo.title.length.toString().constructor`;
const [namespace, ...rest] = exp.split('.');
//console.log({ namespace, rest });


// item.title.length.toString().constructor

function resolveValue(item, path) {

  // item, title, length, toString, constructor
  let pathParts = path.split('.');

  while (pathParts.length > 0) {

    const op = pathParts.shift();
    console.log(op);

    if (op.endsWith('()')) {
      item = item[op.substr(0,item.length - 2)]();
    } else {
      item = item[op];
    }
    
  }

}

const result = resolveValue(data, 'item.title.length.toString().constructor');
console.log(result);
