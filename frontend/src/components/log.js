import React, { Component } from 'react'
import fetch from 'isomorphic-fetch'
import { Table, Button, Popup, Icon, Form } from 'semantic-ui-react'
import _ from 'lodash'
import Datetime from 'react-datetime'
import 'moment/locale/nb'

class Log extends Component {
  constructor (props) {
    super(props)
    this.props = props
    this.state = {
      data: [],
      column: null,
      direction: null,
      dateRange: false,
      formDesc: '',
      formDevIds: [],
      formAdaptIds: [],
      formDate: '',
      formDateFrom: '',
      formDateTo: ''
    }
    this.logHeaders = [
      { key: 'system_log_id', text: 'Log id', value: 'system_log_id' },
      { key: 'device_id', text: 'Device id', value: 'device_id' },
      { key: 'adaption_id', text: 'Adaption id', value: 'adaption_id' },
      { key: 'description', text: 'Description', value: 'description' },
      { key: 'created', text: 'Date', value: 'created' }
    ]
    this.adaptionIds = [
      { key: 1, text: 1, value: 1 },
      { key: 2, text: 2, value: 2 },
      { key: 3, text: 3, value: 3 },
      { key: 4, text: 4, value: 4 }
    ]
    this.deviceIds = [
      { key: 1, text: 1, value: 1 },
      { key: 2, text: 2, value: 2 },
      { key: 3, text: 3, value: 3 },
      { key: 4, text: 4, value: 4 }
    ]
    this.queryParams = {
      'date': 'formDate',
      'desc': 'formDesc',
      'deviceids': 'formDevIds',
      'adaptids': 'formAdaptIds',
      'datefrom': 'formDateFrom',
      'dateto': 'formDateTo'
    }
  }

  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: 'ascending'
      })

      return
    }

    this.setState({
      data: data.reverse(),
      direction: direction === 'ascending' ? 'descending' : 'ascending'
    })
  }
  componentDidMount () {
    // Fetch logs from rest api
    this.fetchLog()
  }
  fetchLog () {
    fetch('http://localhost:8090/syslog')
      .then(res => {
        return res.json()
      })
      .then(data => {
        this.setState({ data: data })
      })
  }
  filter () {
    // validate form
    let queryList = []
    let q = Object.assign({}, this.queryParams)
    let queryString = ''

    if (this.state.dateRange) {
      // remove date entry if range is selected
      delete q['date']
    } else {
      // and vice versa
      delete q['datefrom']
      delete q['dateto']
    }
    // filter and add to query array
    for (let i in q) {
      let a = this.state[q[i]]
      if (a !== '' && a !== [] && a) {
        // not empty value
        if (i.startsWith('date')) {
          // is date string
          // format
          a = a.format('YYYY-MM-DD[T]HH:mm:ss[Z]')
        }
        console.log(q[i], a)
        queryList.push({ [i]: a })
      }
    }
    // build string
    if (queryList.length !== 0) {
      // list not empty
      queryString += '?'
      queryString += queryList.map((o) => Object.keys(o)[0] + '=' + o[Object.keys(o)[0]]).join('&')
    }
    console.log(queryString)

    // and then fetch
    fetch('localhost:8090/syslog' + queryString)
      .then(res => {
        return res.json()
      })
      .then(data => {
        this.setState({ data: data })
      })
  }
  toggleDateRange () {
    this.setState({ dateRange: !this.state.dateRange })
  }
  onChange = e => this.setState({ [e.name]: e.value })

  onDateToChange = (name, e) => {
    if (e.isAfter(this.state.formDateFrom)) {
      this.setState({ [name]: e })
    }
  }
  onDateChange = (name, e) => {
    // returns moment obj if valid date
    if (typeof e === 'object') {
      this.setState({ [name]: e })
    }
  }

  render () {
    const { column, data, direction, dateRange, formDesc, formDate, formDateFrom, formDateTo } = this.state
    return (
      <div style={{
        marginLeft: '20vw',
        paddingTop: '50px',
        display: 'flex',
        flexDirection: 'row'
      }
      }>
        <Form>
          <Form.Input
            placeholder="Description"
            icon='search'
            iconPosition='left'
            name="formDesc"
            onChange={e => this.onChange(e.target)}
            value={formDesc}
          />
          <Form.Dropdown
            options={this.deviceIds}
            placeholder="Device ids"
            name="formDevIds"
            onChange={(e, data) => this.onChange(data)}
            fluid selection clearable multiple />
          <Form.Dropdown
            options={this.adaptionIds}
            placeholder="Adaption ids"
            name="formAdaptIds"
            onChange={(e, data) => this.onChange(data)}
            fluid selection clearable multiple />
          <Form.Field>
            <span style={{ textAlign: 'center' }}>Date
              <Popup
                content={dateRange ? 'Filter by single date' : 'Filter by date range'}
                trigger={
                  <Icon
                    link
                    style={{ marginLeft: '5px' }}
                    name='arrows alternate horizontal'
                    onClick={() => this.toggleDateRange()}
                  />}
              />
            </span>
          </Form.Field>
          {
            dateRange
              ? <Form.Group grouped >
                <Form.Field
                  control={Datetime}
                  label="From"
                  dateFormat="YYYY-MM-DD"
                  timeFormat='HH:mm:ss'
                  width={16}
                  onChange={e => this.onDateChange('formDateFrom', e)}
                  name="formDateFrom"
                  value={formDateFrom}
                />
                <Form.Field
                  control={Datetime}
                  label="To"
                  dateFormat="YYYY-MM-DD"
                  timeFormat='HH:mm:ss'
                  width={16}
                  onChange={e => this.onDateToChange('formDateTo', e)}
                  name="formDateTo"
                  value={formDateTo}
                />
              </Form.Group>
              : <Form.Group widths={1}>
                <Form.Field
                  control={Datetime}
                  dateFormat="YYYY-MM-DD"
                  timeFormat='HH:mm:ss'
                  width={16}
                  onChange={e => this.onDateChange('formDate', e)}
                  name="formDate"
                  value={formDate}
                />
              </Form.Group>
          }

          <Button
            type="submit"
            onClick={() => this.filter()}
            content="Filter"
            primary fluid />
        </Form>
        <Table sortable celled collapsing style={{ margin: '0', marginLeft: '40px' }}>
          <Table.Header>
            <Table.Row>
              {
                this.logHeaders.map(o => {
                  return (
                    <Table.HeaderCell
                      key={o['value']}
                      sorted={column === o['value'] ? direction : null}
                      onClick={this.handleSort(o['value'])}
                    >
                      {o['text']}
                    </Table.HeaderCell>
                  )
                })
              }
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map(o => {
              return (
                <Table.Row key={o['created']}>
                  <Table.Cell>{o['system_log_id']}</Table.Cell>
                  <Table.Cell>{o['device_id']}</Table.Cell>
                  <Table.Cell>{o['adaption_id']}</Table.Cell>
                  <Table.Cell>{o['description']}</Table.Cell>
                  <Table.Cell>{o['created']}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

      </div >
    )
  }
}
export default Log
