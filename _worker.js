// SPDX-License-Identifier: 0BSD

// 定义Cloudflare的DNS查询URL
const doh = 'https://cloudflare-dns.com/dns-query'
const dohjson = 'https://cloudflare-dns.com/dns-query'

// 定义Content-Type
const contype = 'application/dns-message'
const jstontype = 'application/dns-json'

// 定义404响应
const r404 = new Response(null, {status: 404});

// 参考Cloudflare Worker的fetch-event语法模块
// developers.cloudflare.com/workers/runtime-apis/fetch-event/#syntax-module-worker
export default {
	async fetch(request, env, ctx) {
		// 当res是Promise<Response>时，可以减少计费的墙上时间
		// blog.cloudflare.com/workers-optimization-reduces-your-bill
		let res = r404; // 默认返回404响应
		const { method, headers, url } = request; // 从请求中获取方法、头部和URL
		const searchParams = new URL(url).searchParams; // 获取查询参数

		// 如果是GET请求，并且查询参数中有'dns'
		if (method == 'GET' && searchParams.has('dns')) {
			// 向DoH服务器发起GET请求
			res = await fetch(doh + '?dns=' + searchParams.get('dns'), {
				method: 'GET',
				headers: {
					'Accept': contype,
				}
			});
		} else if (method === 'POST' && headers.get('content-type') === contype) {
			// 如果是POST请求，并且Content-Type是'application/dns-message'
			// 直接流式处理请求体，可以优化性能
			const rostream = request.body;
			res = await fetch(doh, {
				method: 'POST',
				headers: {
					'Accept': contype,
					'Content-Type': contype,
				},
				body: rostream,
			});
		} else {
			// 如果是GET请求，并且Accept头部是'application/dns-json'
			const search = new URL(url).search; // 获取查询字符串
			res = await fetch(dohjson + search, {
				method: 'GET',
				headers: {
					'Accept': jstontype,
				}
			});
		}

	return res; // 返回响应
	},
};
