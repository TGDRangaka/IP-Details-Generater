$('#ipAddress').on('input', function(){
    let value = $(this).val();
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (ipv4Regex.test($(this).val())) {
        $(this).css('background', "#89ff99");
        $('#binaryAddress').val(ipToBinary(value));
        $('#searchBtn').prop("disabled", false);
    } else {
        $(this).css('background', "#ff8c8c");
        $('#searchBtn').prop("disabled", true);
    }
});

$('input[type="radio"]').change(function() {
    var selectedValue = $(this).val();

    if (selectedValue === 'prefix') {
        $('#prefix').prop('disabled', false);
        $('#ddn').prop('disabled', true);
        $('#binary').prop('disabled', true);
    } else if (selectedValue === 'ddn') {
        $('#prefix').prop('disabled', true);
        $('#ddn').prop('disabled', false);
        $('#binary').prop('disabled', true);
    } else if (selectedValue === 'binary') {
        $('#prefix').prop('disabled', true);
        $('#ddn').prop('disabled', true);
        $('#binary').prop('disabled', false);
    }
});

$('#searchBtn').on('click', ()=>{
    let isHaveSubnet = false;

//    get ip address
    let ip = $('#ipAddress').val();
    let binaryIp = $('#binaryAddress').val();

//    get class/ network bits/ host bits
    let ipClsDetails = getClassDetails(ip);
    let ipCls = ipClsDetails[0];

    let networkBits = ipCls == 'A' ? 8 : ipCls == 'B' ? 16 : ipCls == 'C' ? 24 : 0;
    let hostBits = 32 - networkBits;
    let subnetBits = 0;
    console.log(ip + " " + ipCls + " " + networkBits + " " + hostBits);

//    common details
    let validNetworks = ipClsDetails[1];
    let totalNetworks = ipClsDetails[2];
    let networkId = ipClsDetails[3];
    let newworkOctets = ipClsDetails[4];
    let totalHosts = 0;

//    get subnet details
    let prefixBits = Number.parseInt($('#prefix').val());
    let ddn = $('#ddn').val();
    let binarySubnet = $('#binary').val();
    let totalSubnets = 0;
    let hostPerSubnet = 0;

    if(!prefixBits && !ddn && !binarySubnet){
        isHaveSubnet = false;
        prefixBits = networkBits;
        ddn = prefixBitsToDdn(prefixBits);
        binarySubnet = ddnToBinary(ddn);
    }else{
        isHaveSubnet = true;
        if($("input[name='subnet']:checked").val() == 'prefix'){
            hostBits = hostBits - subnetBits;
            ddn = prefixBitsToDdn(prefixBits);
            binarySubnet = prefixBtisToBinary(prefixBits);
        }else if($("input[name='subnet']:checked").val() == 'ddn'){
            binarySubnet = ddnToBinary(ddn);
            let index = binarySubnet.replaceAll('.','').indexOf('0');
            prefixBits = index !== -1 ? index : 32;
        }else if($("input[name='subnet']:checked").val() == 'binary'){
            prefixBits = binarySubnet.replaceAll('.','').indexOf('0');
            ddn = prefixBitsToDdn(prefixBits);
        }
        subnetBits = prefixBits - networkBits;
        hostBits = 32 - prefixBits;
    }
    totalHosts = Math.pow(2,hostBits) -2;
    totalSubnets = Math.pow(2, subnetBits);
    hostPerSubnet = `2<sup>${hostBits}</sup> - 2`;

//      first network
    let f1NetworkId = '';
    if(isHaveSubnet){
        f1NetworkId = networkId;
    }else{
        f1NetworkId = ipCls == 'A' ? '1.0.0.0' : ipCls == 'B' ? '128.0.0.0' : ipCls == 'C' ? '192.0.0.0' : 'N/A';
    }
    f1FirstUsableIP = getIpAddress(f1NetworkId, 1);
    let f1BroadcastIp = getBroadcastIp(ipToBinary(f1NetworkId), prefixBits, hostBits);
    let f1LastUsableIP = getIpAddress(f1BroadcastIp, -1);

//      next network
    let f2NetworkId = '';
    if(isHaveSubnet){
        f2NetworkId = getNextSubnetId(ipToBinary(f1NetworkId), networkBits, subnetBits, hostBits);
    }else{
        f2NetworkId = getNextNetwordId(ipToBinary(f1NetworkId), networkBits);
    }
    let f2FirstUsableIp = getIpAddress(f2NetworkId, 1);
    let f2BroadcastIp = getBroadcastIp(ipToBinary(f2NetworkId),prefixBits,hostBits);
    let f2LastUsableIp = getIpAddress(f2BroadcastIp, -1);


//      last network
    let lastNetworkId = '';
    if(isHaveSubnet){
        lastNetworkId = getLastSubnetId(ipToBinary(f1NetworkId), networkBits, subnetBits, hostBits);
    }else{
        lastNetworkId = getLastNetworkIp(ipCls);
    }
    let lastFirstUsableIp = getIpAddress(lastNetworkId, 1);
    let lastBroadcaseIp = getBroadcastIp(ipToBinary(lastNetworkId), prefixBits, hostBits);
    let lastLastUsableIp = getIpAddress(lastBroadcaseIp, -1);

//  exisiting subnet
    let currentNetworkId = '';
    if(isHaveSubnet){
        currentNetworkId = getCurrentNetworkId(binaryIp, prefixBits, hostBits);
    }else{
        currentNetworkId = ipCls == 'A' ? newworkOctets + '0.0.0' : ipCls == 'B' ? newworkOctets + '0.0' : ipCls == 'C' ? newworkOctets + '0' : 'N/A';
    }
    let currentFirstUsableIp = getIpAddress(currentNetworkId, 1);
    let currentBroadcastIp = getBroadcastIp(ipToBinary(currentNetworkId), prefixBits, hostBits);
    let currentLastUsableIp = getIpAddress(currentBroadcastIp, -1);


//   see details
    // console.log(
    //     'IP : ' + ip +
    //     '\nIP Binary : ' + binaryIp +
    //     '\nclass : ' + ipCls +
    //     '\nnetwork octets : ' + newworkOctets +
    //     '\nnetwork bits : ' + networkBits +
    //     '\nsubnet bits : ' + subnetBits + 
    //     '\nhost bits : ' + hostBits + 
    //     '\nnetwork ID : ' + networkId + 
    //     '\nvalid networks : ' + validNetworks +
    //     '\ntotal networks : ' + totalNetworks +
    //     '\ntotal networks : ' + (ipCls=='A'?'2<sup>7</sup> - 2':ipCls=='B'?'2<sup>14</sup>':ipCls=='C'?'2<sup>21</sup>':'N/A') +
    //     '\ntotal hosts : ' + totalHosts +
    //     '\ntotal subnets : ' + totalSubnets +
    //     '\nhosts per subnet : ' + hostPerSubnet +
    //     '\nprefix : ' + prefixBits +
    //     '\nddn : ' + ddn +
    //     '\nbinary : ' + binarySubnet +
    //     '\n-----------------------------' +
    //     '\nF1 Network Id : ' + f1NetworkId +
    //     '\nF1 First ip address : ' + f1FirstUsableIP +
    //     '\nF1 Last ip address : ' + f1LastUsableIP +
    //     '\nF1 Broadcast IP : ' + f1BroadcastIp +
    //     '\n-----------------------------' +
    //     '\nF2 Network IP : ' + f2NetworkId +
    //     '\nF2 First ip address : ' + f2FirstUsableIp +
    //     '\nF2 Last ip address : ' + f2LastUsableIp +
    //     '\nF2 Broadcast IP : ' + f2BroadcastIp +
    //     '\n-----------------------------' +
    //     '\nLast Network IP : ' + lastNetworkId +
    //     '\nLast First ip address : ' + lastFirstUsableIp +
    //     '\nLast Last ip address : ' + lastLastUsableIp +
    //     '\nLast Broadcast IP : ' + lastBroadcaseIp +
    //     '\n-----------------------------' +
    //     '\nCurrent Network IP : ' + currentNetworkId +
    //     '\nCurrent First ip address : ' + currentFirstUsableIp +
    //     '\nCurrent Last ip address : ' + currentLastUsableIp +
    //     '\nCurrent Broadcast IP : ' + currentBroadcastIp
    // );

    // set data
    $('#prefix').val(prefixBits);
    $('#ddn').val(ddn);
    $('#binary').val(binarySubnet);

    // common details
    $('#class').text(ipCls);
    $('#networkOctets').text(networkBits/8);
    $('#networkBits').text(networkBits);
    $('#subnetBits').text(subnetBits);
    $('#hostBits').text(hostBits);
    $('#networkId').text(networkId);
    $('#validNetworkRange').text(validNetworks);
    $('#totalNetworks').html((ipCls=='A'?'2<sup>7</sup> - 2':ipCls=='B'?'2<sup>14</sup>':ipCls=='C'?'2<sup>21</sup>':'N/A') + ` (${totalNetworks})`);
    $('#totalSubnets').text(subnetBits == 0 ? 0 : totalSubnets);
    $('#hostsPerSubnet').html(subnetBits == 0 ? '0' : hostPerSubnet + ' (' +totalHosts+')');
    $('#totalHosts').html(subnetBits == 0 ? hostPerSubnet + ' (' +totalHosts+')' : totalSubnets * (Math.pow(2,hostBits) -2));

    // first network
    $('#firstNetwork .id').text(f1NetworkId);
    $('#firstNetwork .firstIp').text(f1FirstUsableIP);
    $('#firstNetwork .lastIp').text(f1LastUsableIP);
    $('#firstNetwork .broadcastIp').text(f1BroadcastIp);

    // second network
    $('#secondNetwork .id').text(f2NetworkId);
    $('#secondNetwork .firstIp').text(f2FirstUsableIp);
    $('#secondNetwork .lastIp').text(f2LastUsableIp);
    $('#secondNetwork .broadcastIp').text(f2BroadcastIp);

    // last network
    $('#lastNetwork .id').text(lastNetworkId);
    $('#lastNetwork .firstIp').text(lastFirstUsableIp);
    $('#lastNetwork .lastIp').text(lastLastUsableIp);
    $('#lastNetwork .broadcastIp').text(lastBroadcaseIp);

    // exisiting network
    $('#exisitingNetwork .id').text(currentNetworkId);
    $('#exisitingNetwork .firstIp').text(currentFirstUsableIp);
    $('#exisitingNetwork .lastIp').text(currentLastUsableIp);
    $('#exisitingNetwork .broadcastIp').text(currentBroadcastIp);

    if(isHaveSubnet){
        $('#firstTitle').text('First Subnet');
        $('#secondTitle').text('Second Subnet');
        $('#lastTitle').text('Last Subnet');
        $('#exisitingTitle').text('Exisiting Subnet');
    }else{
        $('#firstTitle').text('First Network');
        $('#secondTitle').text('Second Network');
        $('#lastTitle').text('Last Network');
        $('#exisitingTitle').text('Exisiting Network');
    }

});

function getCurrentNetworkId(binaryIp, prefixBits, hostBits){
    let broadcast = binaryIp.replaceAll('.','').substr(prefixBits, hostBits).replaceAll('1','0');
    broadcast = binaryIp.replaceAll('.','').substr(0, prefixBits) + broadcast;
    broadcast = insertDots(broadcast);
    let broadcastIp = broadcast.split('.');
    return broadcastIp.map(octet =>{return parseInt(octet,2);}).join('.');
}

function getLastSubnetId(binaryIp, networkBits, subnetBits, hostBits){
    let subnet = binaryIp.replaceAll('.','').substr(networkBits,subnetBits).replaceAll('0','1');
    let network = binaryIp.replaceAll('.','').substr(0,networkBits);
    let host = binaryIp.replaceAll('.','').substr(networkBits+subnetBits,hostBits);
    let ip = insertDots(network + subnet + host);
    return ip.split('.').map(octet =>{return parseInt(octet,2)}).join('.');
}

function getLastNetworkIp(ipClss){
    switch(ipClss){
        case 'A' : return '126.0.0.0';
        case 'B' : return '191.255.0.0';
        case 'C' : return '223.255.255.0';
        default : return 'N/A';
    }
}

function getNextNetwordId(binaryIp, networkBits){
    let network = parseInt(binaryIp.replaceAll('.','').substr(0, networkBits),2) + 1;
    network = decimalToBinaryWithPadding(network, networkBits);
    network = network + binaryIp.replaceAll('.','').substr(networkBits, 32 - networkBits);
    return insertDots(network).split('.').map(octet =>{return parseInt(octet,2)}).join('.');
}

function getNextSubnetId(binaryIp, networkBits, subnetBits, hostBits){
    let subnet = parseInt(binaryIp.replaceAll('.','').substr(networkBits,subnetBits),2) + 1;
    subnet = decimalToBinaryWithPadding(subnet, subnetBits);
    let network = binaryIp.replaceAll('.','').substr(0,networkBits);
    let host = binaryIp.replaceAll('.','').substr(networkBits+subnetBits,hostBits);
    let ip = insertDots(network + subnet + host);
    return ip.split('.').map(octet =>{return parseInt(octet,2)}).join('.');
}

function getBroadcastIp(binaryIp, prefixBits, hostBits){
    let broadcast = binaryIp.replaceAll('.','').substr(prefixBits, hostBits).replaceAll('0','1');
    broadcast = binaryIp.replaceAll('.','').substr(0, prefixBits) + broadcast;
    broadcast = insertDots(broadcast);
    let broadcastIp = broadcast.split('.');
    return broadcastIp.map(octet =>{return parseInt(octet,2);}).join('.');
}

function getIpAddress(ipAddress, index){
    let octets = ipAddress.split('.');
    octets[3] = (parseInt(octets[3]) + index).toString();
    return octets.join('.');
}

function ipToBinary(ipAddress) {
    const octets = ipAddress.split('.');
  
    const binaryOctets = octets.map(octet => {
      const binary = parseInt(octet, 10).toString(2);
      return '00000000'.substring(binary.length) + binary;
    });
  
    const binaryIPAddress = binaryOctets.join('.');
    return binaryIPAddress;
}

function prefixBitsToDdn(prefixBits){

    let octet1 = Math.floor(prefixBits / 8);
    let octet2 = Math.floor(prefixBits % 8);

    let ddn = "255.".repeat(octet1) + (256 - Math.pow(2, 8 - octet2));

    while (ddn.split('.').length < 4) {
        ddn += ".0";
    }

    return ddn;
}

function prefixBtisToBinary(prefixBits){

    let octet1 = Math.floor(prefixBits / 8);
    let octet2 = Math.floor(prefixBits % 8);

    let binary = "11111111.".repeat(octet1) + "1".repeat(octet2) + "0".repeat(8 - octet2);

    while (binary.split('.').length < 4) {
        binary += ".00000000";
    }

    return binary;
}

function ddnToBinary(ddn) {
    let octets = ddn.split('.');

    let binary = octets.map(octet => {
        return ('00000000' + parseInt(octet, 10).toString(2)).slice(-8);
    }).join('.');

    return binary;
}

function getClassDetails(ip){
    let firstOctets = Number.parseInt(ip.split('.')[0]);
    let ar = ip.split('.');

    if(firstOctets > 0 && firstOctets < 127){
        return ['A','1.0.0.0 - 126.0.0.0', Math.pow(2, 7)-2, getNetworkId(ip, 'A'), ar[0]+'.'];
    }else if(firstOctets > 127 && firstOctets < 192){
        return ['B','128.0.0.0 - 191.255.0.0', Math.pow(2, 14), getNetworkId(ip, 'B'), ar[0]+'.'+ar[1]+'.'];
    }else if(firstOctets > 191 && firstOctets < 224){
        return ['C','192.0.0.0 - 223.255.255.0', Math.pow(2, 21), getNetworkId(ip, 'C'), ar[0]+'.'+ar[1]+'.'+ar[2]+'.'];
    }else if(firstOctets > 223 && firstOctets < 240){
        return ['D','224.0.0.0 - 239.255.255.255', 0];
    }else if(firstOctets > 239 && firstOctets < 255){
        return ['E','240.0.0.0 - 255.255.255.255', 0];
    }else{
        return ['?','?', 0];
    }
}

function getNetworkId(ip, clss){
    let octets = ip.split('.');
    switch(clss){
        case 'A': return octets[0] + '.0.0.0';
        case 'B': return octets[0] + '.' + octets[1] + '.0.0';
        case 'C': return octets[0] + '.' + octets[1] + '.' + octets[2] + '.0';
        default : return 'N/A';
    }
}

function insertDots(binaryString) {
    const regex = new RegExp(`.{1,${8}}`, 'g');
    return binaryString.match(regex).join('.');
}

function decimalToBinaryWithPadding(decimalNumber, bitLength) {
    let binaryRepresentation = decimalNumber.toString(2);
    let leadingZeros = bitLength - binaryRepresentation.length;
    if (leadingZeros > 0) {
        binaryRepresentation = '0'.repeat(leadingZeros) + binaryRepresentation;
    }
    return binaryRepresentation;
}