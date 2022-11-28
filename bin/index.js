#!/usr/bin/env node
let argv = process.argv
const { name, version } = require('../package.json')
const path = require('path')
const fs = require('fs')
// 文件转对象
const fileToObj = (filePath = './data.json') => {
  filePath = path.resolve(__dirname, filePath)
  return JSON.parse(fs.readFileSync(filePath).toString())
}
// 对象转文件
const objToFile = (dataObj, filePath = './data.json') => {
  fs.writeFileSync(
    path.resolve(__dirname, filePath),
    JSON.stringify(dataObj)
  )
}
// 是否为镜像源格式
const isURL = (str_url) => {
  var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
    + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
    + "|" // 允许IP和DOMAIN（域名）
    + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
    + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
    + "[a-z]{2,6})" // first level domain- .com or .museum
    + "(:[0-9]{1,4})?" // 端口- :80
    + "((/?)|" // a slash isn't required if there is no file name
    + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
  var re = new RegExp(strRegex);
  //re.test()
  if (re.test(str_url)) {
    return (true);
  } else {
    return (false);
  }
}
const help = () => {
  console.log('\033[46;30m ' + `${name} v${version}` + ' \033[0m')
  console.log(`-h 或者 help => 查看命令`)
  console.log(`-V => 查看版本号`)
  console.log(`ls => 查看镜像源列表`)
  console.log(`add <镜像源名称:必填项> <镜像源地址:必填项> => 添加镜像源`)
  console.log(`del <镜像源名称:必填项> => 删除镜像源`)
  console.log(`use <镜像源名称:必填项> => 切换镜像源`)
  console.log(''.padEnd(`add <镜像源名称:必填项> <镜像源地址:必填项> => 添加镜像源`.length * 1.6, '-'))
}
// 获取registry列表
let registryObj = fileToObj()
if (argv.includes('-h') || argv.includes('help')) {
  help()
} else if (argv.includes('-V')) {
  console.log(`${name} v${version}`)
} else if (argv.includes('ls')) {
  const { exec } = require('child_process')
  exec(`npm config get registry`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`exec error:${error}`)
        return
      }
      let registryObjMaxLengthItem = Object.keys(registryObj).reduce((prev, cur) => {
        return prev.length < cur.length ? cur : prev
      })
      const maxLength = registryObjMaxLengthItem.length + 3
      Object.keys(registryObj).forEach(registryKey => {
        if (stdout.toString().trim() == registryObj[registryKey]) {
          console.log('\033[40;36m' + `${registryKey.padEnd(maxLength, '-')}> ${registryObj[registryKey]}` + '\033[0m')
        }
        else {
          console.log(`${registryKey.padEnd(maxLength, '-')}> ${registryObj[registryKey]}`)
        }
      })
    }
  )
} else if (argv.includes('add')) {
  let index = argv.indexOf('add')
  let key = argv[index + 1]
  let value = argv[index + 2]
  if (!isURL(value) || !value) {
    console.log('\033[40;31m' + `<失败 add> 传入了一个非法的镜像源地址 => ${value}` + '\033[0m')
    return
  }
  if (!Object.keys(registryObj).includes(key)) {
    objToFile({
      ...registryObj,
      [key]: value
    })
    console.log('\033[40;32m' + `<成功 add> 已添加至镜像源列表 => ${key}` + '\033[0m')
  } else {
    console.log('\033[40;31m' + `<失败 add> 已经存在于镜像源列表 => ${key}` + '\033[0m')
  }
} else if (argv.includes('del')) {
  let index = argv.indexOf('del')
  let key = argv[index + 1]
  if (!key) {
    console.log('\033[40;31m' + `<失败 del> 请传入了一个需要删除的镜像源名称` + '\033[0m')
    return
  }
  if (!Object.keys(registryObj).includes(key)) {
    console.log('\033[40;31m' + `<失败 del> 传入的镜像源名称不存在 => ${key}` + '\033[0m')
    return
  }
  delete registryObj[key]
  objToFile(registryObj)
  console.log('\033[40;32m' + `<成功 del> 已删除镜像源 => ${key}` + '\033[0m')
} else if (argv.includes('use')) {
  let index = argv.indexOf('use')
  let key = argv[index + 1]
  if (!Object.keys(registryObj).includes(key)) {
    console.log('\033[40;31m' + `<失败 use> 镜像源名称不存在 => ${key}` + '\033[0m')
    return
  }
  const { exec } = require('child_process')
  exec(`npm config set registry ${registryObj[key]}`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`exec error:${error}`)
        return
      }
      console.log('\033[40;32m' + `<成功 use> 已设置镜像源 => ${registryObj[key]}` + '\033[0m')
    }
  )
} else {
  console.log('\033[40;31m' + `<失败> 错误的指令` + '\033[0m')
  help()
}