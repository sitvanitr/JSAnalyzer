// sleep time expects milliseconds

class Utils{
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

if (typeof module != 'undefined' && typeof module.exports != 'undefined')
    module.exports = new Utils();


