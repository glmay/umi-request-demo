import {
  GlobalHttpOptions,
  SingleHttpOptions,
} from './interface'
import { 
  RequestMethod, 
  RequestResponse, 
  ResponseError,
} from 'umi-request'
import createExtendRequestInstance from './extendRequest'

export default (function() {
  let globalHttpOption: GlobalHttpOptions = {}
  let umiInstance: RequestMethod | null = null

  function startFetch<T, R>(options: SingleHttpOptions) {

    return new Promise<RequestResponse<R>>((resolve, reject) => {
      if (!umiInstance) {
        return reject(new Error('请先进行实例化操作requestInit'))
      }

      const newOptions = {
        ...globalHttpOption,
        ...options
      }

      // 传递含有自定义属性的newOptions进去，在拦截器中会删除自定义属性，只保留umi-request原生属性
      return umiInstance[options.method](options.url, newOptions)
      .then((resp: RequestResponse<R>) => {
        if (
          globalHttpOption.du &&
          typeof globalHttpOption.du.successCallback === 'function'
        ) {
          globalHttpOption.du.successCallback(resp, options)
        }
        resolve(resp)
      }).catch((error: ResponseError) => {
        // 兼容处理（errorHandler和globalHttpOption.du.errorCallback）,防止重复进行错误处理
        // globalHttpOption.errorHandler优先级高于globalHttpOption.du.errorCallback
        if (
          !globalHttpOption.errorHandler &&
          globalHttpOption.du &&
          typeof globalHttpOption.du.errorCallback === 'function'
        ) {
          globalHttpOption.du.errorCallback(
            options,
            error
          )
        }
        reject(error)
      })
    })
  }

  return {
    requestInit(options: GlobalHttpOptions): RequestMethod {
      if (!umiInstance) umiInstance = createExtendRequestInstance(options)
      if (options) globalHttpOption = options

      // 这里返回与否意义不大，request内部会直接使用umiInstance实例
      return umiInstance
    },
    request<T = any, R = any>(
      options: SingleHttpOptions
    ): Promise<RequestResponse<R>> {
      return startFetch<T, R>(options)
    }
  }
})()
