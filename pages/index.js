import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Compound from '@compound-finance/compound-js';
import calculateApy from '../apy.js';

//{apys} : extract apys
export default function Home({ apys }) {
  //pass numbers as arguments
    const formatPercent = number => 
    `${new Number(number).toFixed(2)}%`

  return (
    <div className = 'container'>

    <Head>
            <title>Compound dashboard</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <div className='row mt-4'>
            <div className='col-sm-12'>
              <div className="jumbotron">
                <h1 className='text-center'>Compound Dashboard</h1>
                <h5 className="display-4 text-center">Shows Compound APYs <br/> with COMP token rewards</h5>
              </div>
            </div>
          </div>

      <table className = 'container'>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Supply APY</th>
            <th>COMP APY</th>
            <th>Total APY</th>
          </tr>
        </thead>
        <tbody>
          { apys && apys.map(apy => (
            <tr key={apy.ticker}>
              <td>
                <img src ={ `img/${apy.ticker.toLowerCase()}.png`}
                style={{width: 25, height: 25, marginRight:10}}
              />
              {apy.ticker.toUpperCase()}
              </td>
              <td>
               {formatPercent(apy.supplyApy)}
              </td>
              <td>
               {formatPercent(apy.compApy)}
              </td>
              <td>
               {formatPercent(parseFloat(apy.supplyApy)) + formatPercent(parseFloat(apy.compApy))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
     
    </div>
  )
}
//the request received from a home component, it is gonne execute the server side function before
export async function getServerSideProps(context){
  const apys = await Promise.all([    
    calculateApy(Compound.cDAI, 'DAI'),
    calculateApy(Compound.cUSDC, 'USDC'),
    calculateApy(Compound.cUSDT, 'USDT')
  ]);

  return {
    props: {//JSnext convention
      //a array apys
      apys
    }
  }
}
