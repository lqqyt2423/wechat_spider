node-easy-cert
-------------------

[![npm download][download-image]][download-url]

[download-image]: https://img.shields.io/npm/dm/node-easy-cert.svg?style=flat-square
[download-url]: https://npmjs.org/package/node-easy-cert


## 用于管理自生成的HTTPS证书的插件
本插件可以生成自签名的root证书，并基于该root证书，生成各个域名的HTTPS证书。

## 使用方式
```js
const CertManager = require('cert-manager');

const options = {
  rootDirPath: '/the/full/path/of/the/dir', // default to /{USER_HOME}/{.node_easy_certs}/
  // the default attrs of a generated cert, you can change it here
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'CertManager' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'CertManager SSL' }
  ]
}

const crtMgr = new CertManager(options);
const rootOptions = {
  commonName: 'theNameYouLike'
};

crtMgr.generateRootCA(rootOptions);
```
## 配置项(可选)

### rootDirPath
证书目录的全路径，如果配置，优先级高于rootDirName

## 证书生成目录
默认情况下，证书都会生成在 `{USER_HOME}/.node_easy_certs/`。
如果配置了`rootDirPath`, 那么所有的证书都会生成在该目录下。

## 方法
### generateRootCA(options, callback(error, keyPath, crtPath))
在证书根目录下面生成根证书rootCA.crt 和 rootCA.key。生成后，请选择rootCA.crt,**安装并信任**，否则您的组件可能工作失败。

#### 返回
- 无

#### 参数
- options `object`
  - options.commonName `string` `required`

  rootCA的commonName，安装后，将会作为系统里面的证书名称显示在列表中
  - options.overwrite `bool` `optional`

  `default`: false   
  > 是否覆盖已经存在的rootCA，默认为false。在false的情形下，如果遇到已经存在的rootCA，会返回错误 `ROOT_CA_EXISTED` 并终止创建。

- callback `function` `optional`

  - error 如果发生错误，将放入error参数
  - keyPath 生成好的rootCA.key的全路径
  - crtPath 生成好的rootCA.crt的全路径

#### 调用示例

```js
const options = {
  commonName: 'yourPreference'
};

crtMgr.generateRootCA(options, (error, keyPath, crtPath) {
  // 如果根证书已经存在，且没有设置overwrite为true，则需要捕获
  if (error === 'ROOT_CA_EXISTED') {
    // 处理当证书已经存在的情形
  }

  if(!error) {
    // 证书需要被安装并信任，可以在此打开该目录并给出提示，也可以进行其他操作
    const isWin = /^win/.test(process.platform);
    const certDir = path.dirname(keyPath);
    if(isWin){
      exec("start .",{ cwd : certDir });
    }else{
      exec("open .",{ cwd : certDir });
    }
  }
});
```

### getCertificate(hostname, callback([error, keyContent, crtContent]))
获取指定域名下的证书的key和crt内容，如果证书还不存在，则会先创建该证书。

> 证书的生成基于生成的rootCA根证书来签名，如果rootCA根证书还未创建，则会终止并抛出错误：`ROOT_CA_NOT_EXISTS`

#### 返回
- 无

#### 参数
- `hostname` `string`
所要获取证书内容的hostname

- `callback` `function`   
获取到内容后的回调函数，主要包含key的内容和crt的内容，如果获取过程中出现异常，则放入error变量中

> 获取子域名的证书，要求已经存在根证书，否则会提示失败。组件会抛出对应的异常。您可以捕获并通过 `generateRootCA()`来生成根证书。**并安装并请信任该根证书**

#### 调用实例
```js
certManager.getCertificate('localhost', (error, keyContent, crtContent) => {

  // 如果根证书还没有生成，需要先生成根证书
  if (error === 'ROOT_CA_NOT_EXISTS') {
    // handle the issue
  }

  // 正常操作
  // ...
});

```

### getRootDirPath()
获取由当前cert-manager实例所管理的证书的根目录

#### 返回
- `string`   
  当前cert-manager实例所管理的证书所对应的根目录。默认为{USER_HOME}/.node_easy_certs/

### getRootCAFilePath()
获取根证书的全路径

#### 返回
- `string`
根证书的全路径，如果根证书不存在，将返回空字符串

### isRootCAFileExists()
获取根证书是否存在的状态

### ifRootCATrusted()
检测RootCA是否已经被信任(windows下不可用)

#### 返回
- `bool` 是否存在根证书

### clearCerts()
清除当前目录下所有的证书文件

#### 返回
- 无

#### 参数
- `callback`  `function`   
删除结束后的回调函数，如果删除过程中有错误，将会被放入error对象中

# 错误码
在运行过程中，会根据错误原因抛出指定错误码，包括如下

| 错误码        | 释义           | 备注|
| ------------- |:-------------:|:----------:|
|ROOT_CA_NOT_EXISTS   |root根证书不存在。当我们执行的某个操作依赖于根证书，而根证书不存在时，就会抛出该异常。我们可以尝试生成根证书||
|ROOT_CA_COMMON_NAME_UNSPECIFIED| commonName未设置。比如当我们调用`genearteRootCA()`时,commonName是必传的。||
|ROOT_CA_EXISTED |rootCA 根证书已经存在。当我们重新生成证书，如果证书已经存在，会抛出该异常。|可以在调用`generateRootCA`时，传入 `option.overwirte=true`来覆盖|

