import { useState, useEffect } from "react";
import PaginationComponent from "./lib/paginator";
import truncateString from "./utils/truncate";
import toFixed from "./utils/toFixed";

import {
  Container,
  Navbar,
  Row,
  Form,
  Button,
  Col,
  Table,
  Alert,
} from "react-bootstrap";

function Transaction({ transaction }) {
  return (
    <tr>
      <td>{transaction.blockNumberNormalized}</td>
      <td>
        <a href={`https://etherscan.io/tx/${transaction.hash}`}>
          {truncateString(transaction.hash, 13)}
        </a>
      </td>
      <td>{truncateString(transaction.from, 13)}</td>
      <td>{truncateString(transaction.to, 13)}</td>
      <td>{transaction.confirmations}</td>
      <td>{new Date(transaction.timeStampNormalized).toDateString()}</td>
      <td>{toFixed(transaction.valueNormalized)}</td>
      <td>{transaction.totalTransactionFee}</td>
    </tr>
  );
}

const loadTransactions = async (queryParams) => {
  let queryString = "";

  if (queryParams) {
    const query = new URLSearchParams();
    query.append("page", queryParams.page);
    query.append("searchBy", queryParams.searchBy);
    query.append("searchText", queryParams.searchText);

    query.forEach((value, key) => {
      if (value === "") query.delete(key);
    });

    queryString = query.toString();
  }

  const response = await fetch(
    `${process.env.REACT_APP_DOMAIN}/v1/transactions${
      queryString !== "" ? "?" + queryString : ""
    }`
  );

  const data = await response.json();

  return [data, response.status];
};

function App() {
  const [loading, setLoading] = useState();
  const [paginationData, setPaginationData] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [alert, setAlert] = useState({
    show: false,
  });
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState({
    searchBy: "",
    searchText: "",
  });

  useEffect(() => {
    async function loadInitialTransactions() {
      try {
        setLoading(true);

        const [data, statusCode] = await loadTransactions({
          page,
          ...formState,
        });

        if (statusCode === 200) {
					console.log(data.transactions);
          setPaginationData(data.pagination);
          setTransactions(data.transactions);
        }

        if (statusCode >= 400 && statusCode <= 500) {
          throw new Error(data.message);
        }
      } catch (error) {
        setAlert({
          show: true,
          variant: "danger",
          message: error.message ?? "something bad happened",
        });
      } finally {
        setLoading(false);
      }
    }

    loadInitialTransactions();
  }, [page, formState]);

  const setCurrentPage = (page) => {
    setPage(page);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
    setFormState(formProps);
    setPage(1);
  };

  return (
    <>
      <Navbar bg="light" expand="lg" className="mb-3">
        <Container>
          <Navbar.Brand>Etherscan demo</Navbar.Brand>
        </Container>
      </Navbar>
      <section>
        <Container>
          <Alert show={alert.show} variant={alert.variant}>
            {alert.message}
          </Alert>
          <Form className="row mb-3" onSubmit={handleSubmit}>
            <Col md={6}>
              <Form.Control name="searchText" type="text" />
            </Col>
            <Col md={4}>
              <Form.Select aria-label="Default select example" name="searchBy">
                <option value={""}>Select options</option>
                <option value="1">From / To address</option>
                <option value="2">Transaction hash</option>
                <option value="3">Block Number</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Button variant="primary" type="submit" disabled={loading}>
                Search
              </Button>
            </Col>
          </Form>

          {loading ? (
            <h1>Loading ...</h1>
          ) : (
            <>
              {transactions.length > 0 ? (
                <Row>
                  <Col md={12}>
                    <Table striped bordered hover className="mb-3" responsive>
                      <thead>
                        <tr>
                          <th>Block Number</th>
                          <th>Transaction ID</th>
                          <th>Sender address</th>
                          <th>Recipient's address</th>
                          <th>Block confirmations</th>
                          <th>Date</th>
                          <th>Value</th>
                          <th>Transaction fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <Transaction key={t._id} transaction={t} />
                        ))}
                      </tbody>
                    </Table>
                  </Col>

                  <div>
                    <PaginationComponent
                      itemsCount={paginationData.totalDocuments}
                      itemsPerPage={paginationData.perPage}
                      currentPage={page}
                      setCurrentPage={setCurrentPage}
                      alwaysShown={transactions.length > 0}
                    />
                  </div>
                </Row>
              ) : (
                <p>Data not found</p>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}

export default App;
