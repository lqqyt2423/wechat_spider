var http=require('http');
var juicer=require('../../src/juicer');

var data={
	list:[
		{name:'guokai<br/>',show:true},
		{name:'benben',show:false},
		{name:'dier',show:true}
	],
	blah:[
		{num:1},
		{num:2},
		{num:3,inner:[
			{'time':'15:00'},
			{'time':'16:00'},
			{'time':'17:00'},
			{'time':'18:00'}
		]},
		{num:4}
	]
};

var tpl=[
	'<ul>',
		'{@each list as it,k}',
			'<li>${k} - $${it.name} {@if it.show} ${it.name} {@/if}</li>',
		'{@/each}',
		'{@each blah as it,k}',
			'<li>',
				'${k} - num:${it.num}<br/>',
				'{@if it.num==3}',
					'{@each it.inner as it2}',
						'${it2.time}<br />',
					'{@/each}',
				'{@/if}',
			'</li>',
		'{@/each}',
	'</ul>'
].join('');

http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<h2>Hello Juicer</h2>\n');
	res.write(juicer(tpl, data));
	res.end();
}).listen(1012);

console.log('Server running at http://127.0.0.1:1012/');
