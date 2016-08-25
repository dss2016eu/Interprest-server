var exec = require('child_process').exec;

var iptables = process.env.IPTABLES || '/sbin/iptables';

function start(ip, port, callback){
  var checkCmd = [iptables, '-t', 'mangle', '-L', 'PREROUTING', '--line-numbers',
    '|', 'grep', ip].join(' ');
  var cmd = [iptables, '-A' , 'PREROUTING', '-t', 'mangle', '-p', 'udp', '!', '-s',
    '127.0.0.1', '--dport', port, '-j', 'TEE', '--gateway', ip].join(' ');
  stop(ip, port, function(err, res) {
    exec(cmd, function(err, stdout, stderr){
      if(err && callback) return callback(err);

      console.log("rule added", ip, port);
      if(callback) return callback(null, true);
    });
  });
}

function stop(ip, port, callback) {
  var cmd = [iptables, '-D' , 'PREROUTING', '-t', 'mangle', '-p', 'udp', '!', '-s',
      '127.0.0.1', '--dport', port, '-j', 'TEE', '--gateway', ip].join(' ');
  exec(cmd, function(err, stdout, stderr){
    if(err) {
      if(callback){
        return callback(err);
      }
    } else {
      console.log("rule removed", ip, port);
      if(callback) {
        return callback(null, true);
      }
    }
  });
}

function stopAll(cb){
  var cmd = 'iptables -t mangle -F';
  exec(cmd, function(err, stdout, stderr){
    if(err) {
      if(callback){
        return callback(err);
      }
    } else {
      console.log("all mangle rules removed");
      if(callback) {
        return callback(null, true);
      }
    }
  });
}

var Stream = {
  start: start,
  stop: stop,
  stopAll: stopAll
};

module.exports = Stream;
