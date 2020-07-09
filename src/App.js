import React, { useState, useEffect } from "react";
import fetch from './api/dataService';
import ReactTable from 'react-table';
import "./App.css";
import _ from 'lodash';

function generate_results(input_data) {

  // Calculate points per transaction
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const points_per_transaction = input_data.map(transaction=> {
    let points = 0;
    let over100 = transaction.amt - 100;
    
    if (over100 > 0) {
      // A customer receives 2 points for every dollar spent over $100 in each transaction      
      points += (over100 * 2);
    }    
    if (transaction.amt > 50) {
      // plus 1 point for every dollar spent over $50 in each transaction
      points += 50;      
    }
    const month = new Date(transaction.transactionDt).getMonth();
    return {...transaction, points, month};
  });
               
  let byCustomer = {};
  let total_points_by_customer = {};
  points_per_transaction.forEach(points_per_transaction => {
    let {custid, name, month, points} = points_per_transaction;   
    if (!byCustomer[custid]) {
      byCustomer[custid] = [];      
    }    
    if (!total_points_by_customer[custid]) {
      total_points_by_customer[name] = 0;
    }
    total_points_by_customer[name] += points;
    if (byCustomer[custid][month]) {
      byCustomer[custid][month].points += points;
      byCustomer[custid][month].monthNumber = month;
      byCustomer[custid][month].numTransactions++;      
    }
    else {
      
      byCustomer[custid][month] = {
        custid,
        name,
        monthNumber:month,
        month: months[month],
        numTransactions: 1,        
        points
      }
    }    
  });
  let tot = [];
  for (var custKey in byCustomer) {    
    byCustomer[custKey].forEach(cRow=> {
      tot.push(cRow);
    });    
  }
  let totByCustomer = [];
  for (custKey in total_points_by_customer) {    
    totByCustomer.push({
      name: custKey,
      points: total_points_by_customer[custKey]
    });    
  }
  return {
    summary_by_customer: tot,
    points_per_transaction,
    total_points_by_customer:totByCustomer
  };
}

function App() {
  const [transaction_data, set_transformed_transactions] = useState(null);
  
  const columns = [
    {
      Header:'Customer',
      accessor: 'name'      
    },    
    {
      Header:'Month',
      accessor: 'month'
    },
    {
      Header: "# of Transactions",
      accessor: 'numTransactions'
    },
    {
      Header:'Reward Points',
      accessor: 'points'
    }
  ];
  const totalsByColumns = [
    {
      Header:'Customer',
      accessor: 'name'      
    },    
    {
      Header:'Totals Points',
      accessor: 'points'
    }
  ]

  function get_transactions(row) {
    let byCustMonth = _.filter(transaction_data.points_per_transaction, (tRow)=>{    
      return row.original.custid === tRow.custid && row.original.monthNumber === tRow.month;
    });
    return byCustMonth;
  }

  useEffect(() => { 
    fetch().then((data)=> {             
      const results = generate_results(data);      
      set_transformed_transactions(results);
    });
  },[]);

  if (transaction_data == null) {
    return <div>Loading...</div>;   
  }

  return transaction_data == null ?
    <div>Loading...</div> 
      :    
    <div>      
      
      <div className="container">
        <div className="row">
          <div className="col-10">
            <h4>Points Rewards System Totals by Customer Months</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-8">
            <ReactTable
              data={transaction_data.summary_by_customer}
              defaultPageSize={5}
              columns={columns}
              SubComponent={row => {
                return (
                  <div>
                    
                      {get_transactions(row).map((tran, key)=>{
                        return <div key={"comtainer"+key} className="container">
                          <div className="row">
                            <div className="col-8">
                              <strong>Transaction Date:</strong> {tran.transactionDt} - <strong>$</strong>{tran.amt} - <strong>Points: </strong>{tran.points}
                            </div>
                          </div>
                        </div>
                      })}                                    

                  </div>
                )
              }}
              />             
            </div>
          </div>
        </div>
        
        <div className="container">    
          <div className="row">
            <div className="col-10">
              <h4>Points Rewards System Totals By Customer</h4>
            </div>
          </div>      
          <div className="row">
            <div className="col-8">
              <ReactTable
                data={transaction_data.total_points_by_customer}
                columns={totalsByColumns}
                defaultPageSize={5}                
              />
            </div>
          </div>
        </div>      
    </div>
  ;
}

export default App;
