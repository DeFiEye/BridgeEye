const tokens = require('./list_56.json');


const allTokens = Object.keys(tokens).map(_ => tokens[_]);
const groupByNames = allTokens.reduce((all, item) => {
    all[item.symbol] =  all[item.symbol] || [];
    all[item.symbol].push(item);
    return all;
}, {})

const hasMultiTokens = Object.keys(groupByNames).map(_ => groupByNames[_]).map(tokens => {
    // remove duplicate
    if (tokens.length > 1) {
        const sortedTokens = tokens.sort((a, b) => {
            return Object.keys(b.destChains).length - Object.keys(a.destChains).length;
        });
        console.log(sortedTokens)
        return [
            sortedTokens[0]
        ]
    }
    return tokens
})

const allTokensList = hasMultiTokens.map(_ => _[0]);
const nameTokens = allTokensList.filter(_ => _.symbol === 'DAI');

console.log(nameTokens)