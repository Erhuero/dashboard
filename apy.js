import Compound from '@compound-finance/compound-js';


//calculate the apy in the backend
//get on infura
const provider = 'https://mainnet.infura.io/v3/53b888932d594b0fa6ffb56fd3698f92';

const comptroller = Compound.util.getAddress(Compound.Comptroller);
//oracle smart contract which give the price in the compoud system
const opf = Compound.util.getAddress(Compound.PriceFeed);

const cTokenDecimals = 8;
//1 block per 15 seconds
const blocksPerDay = 4 * 60 * 24;
const daysPerYear = 365;
//scaling factor use by compound
//trick to do a decimals 
const ethMantissa = Math.pow(10, 18);

//
async function calculateSupplyApy(cToken) {
    //query the supply rate per block
    const supplyRatePerBlock = await Compound.eth.read(
        //address of the cToken
        cToken,
        'function supplyRatePerBlock() returns(uint)',
        [],
        //pass the provider to know how to conect the blockchain
        { provider }
    );
    //compound the supply rate of each block of the year to get an annualized rate
    //the scalable per block is 10 * 18, we need to divide by the same amount to get a real figure
    //compound by days per year -1 because a year period of the period in the year is one less than a number of days
    //- 1 to keep the decimal part * 100 to get a percentage
    return 100 * (Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear - 1) - 1);
}

async function calculateCompApy(cToken, ticker, underlyingDecimals){
    //amount of Comp tokens given to lenders or the borrowers of the market FOR THE CURRENT BLOCK
    //as part of the liquidity mining programm
    let compSpeed = await Compound.eth.read(
        comptroller,
        'function compSpeeds(address cToken) public view returns (uint)',
        [ cToken ],
        { provider }
    );

    let compPrice = await Compound.eth.read(
        //pass the addrss of the oracle
        opf,
        'function price(string memory symbol) external view returns (uint)',
        //ticker for the comp token
        [ Compound.COMP ],
        { provider }
    );
    //if the cToken is cDai, the underlying is DAI
    let underlyingPrice = await Compound.eth.read(
        opf,
        'function price(string memory symbol) external view returns (uint)',
        [ ticker ], 
        { provider }
    );
    //total supply of the cToken we have emmitted
    //the more lenders we have, the higher total supply
    let totalSupply = await Compound.eth.read(
        cToken,
        'function totalSupply() returns (uint)',
        //no argument
        [],
        { provider }
    );
    // if the cToken is cDai and the exchange rate is 10, it's means for 1 cDai we need 10 DAI
    let exchangeRate = await Compound.eth.read(
        cToken,
        'function exchangeRateCurrent() returns (uint)',
        [],
        { provider }
    );

    compSpeed = compSpeed / 1e18;
    //handle decimals
    compPrice = compPrice / 1e6;
    underlyingPrice = underlyingPrice / 1e6;
    //+ before to transform in to a number
    //ethMantissa : the value of the contract is scale by 10 * 18
    exchangeRate = +exchangeRate.toString() / ethMantissa;
    //need to adjust the total supply
    //convert this total supply in terms of dollar
    //we nned first to convert this from the amount of cToken to an amount of underlying token and the usd value
    //the number of decimals of undelying tokens to convert to a full token, we need to divide by math.pow
    //10 * number of decimals of underlying tokens
    totalSupply = (+totalSupply.toString() * exchangeRate * underlyingPrice / Math.pow(10, underlying));
    //calculate the number of comp tokens the borrower receive in one day
    const compPerDay = compSpeed * blocksPerDay;
    //comp tokens the lenders receive in one day
    //no compounding effect, the number of comp tokens receive is not depend on the comp token
    //that you receive in the previous block
    return 100 * (compPrice * compPerDay / totalSupply) & 365;
}

//combine a comp APY and supply APY to calculate the total APY

async function calculateApy(cTokenTicker, underlyingTicker){
    const underlyingDecimals = Compound.decimals[cTokenTicker];
    //get address of the cToken
    const cTokenAddress = Compound.util.getAddress(cTokenTicker);
    //execute supply APY  + comp APY
    const [supplyApy, compApy] = await Promise.all([
        calculateSupplyApy(cTokenAddress),
        calculateCompApy(cTokenAddress, underlyingTicker, underlyingDecimals)
    ]);
    return {ticker: underlyingTicker, supplyApy, compApy};
}

export default calculateApy