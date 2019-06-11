/* global test, expect, beforeEach */
import { kea, useProps, useActions, getContext, resetContext } from '../index'

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext({ createStore: true })
})

test('props hook works', () => {
  const store = getContext().store
  const logic = kea({
    path: () => ['scenes', 'hooky'],
    actions: () => ({
      updateName: name => ({ name })
    }),
    reducers: ({ actions }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    }),
    selectors: ({ selectors }) => ({
      upperCaseName: [
        () => [selectors.capitalizedName],
        (capitalizedName) => {
          return capitalizedName.toUpperCase()
        },
        PropTypes.string
      ],
      capitalizedName: [
        () => [selectors.name],
        (name) => {
          return name.trim().split(' ').map(k => `${k.charAt(0).toUpperCase()}${k.slice(1).toLowerCase()}`).join(' ')
        },
        PropTypes.string
      ]
    })
  })

  let countRendered = 0

  function SampleComponent ({ id }) {
    const { name, capitalizedName, upperCaseName } = useProps(logic)
    const { updateName } = useActions(logic)

    console.log({ name, capitalizedName, upperCaseName })

    countRendered += 1

    return (
      <div>
        <div className='id'>{id}</div>
        <div className='name'>{name}</div>
        <div className='capitalizedName'>{capitalizedName}</div>
        <div className='upperCaseName'>{upperCaseName}</div>
        <div className='updateName' onClick={updateName}>updateName</div>
      </div>
    )
  }

  expect(countRendered).toEqual(0)

  const wrapper = mount(
    <Provider store={getContext().store}>
      <SampleComponent id={12} />
    </Provider>
  )

  expect(countRendered).toEqual(1)

  store.dispatch({ type: 'nothing', payload: { } })
  expect(countRendered).toEqual(1)

  expect(wrapper.find('.id').text()).toEqual('12')
  expect(wrapper.find('.name').text()).toEqual('chirpy')
  expect(wrapper.find('.capitalizedName').text()).toEqual('Chirpy')
  expect(wrapper.find('.upperCaseName').text()).toEqual('CHIRPY')

  expect(store.getState()).toEqual({ kea: {}, scenes: { hooky: { name: 'chirpy' } } })

  store.dispatch(logic.actions.updateName('somename'))
  expect(countRendered).toEqual(2)

  store.dispatch(logic.actions.updateName('somename'))
  expect(countRendered).toEqual(2)

  store.dispatch(logic.actions.updateName('somename3'))
  expect(countRendered).toEqual(3)

  expect(store.getState()).toEqual({ kea: {}, scenes: { hooky: { name: 'somename3' } } })

  wrapper.render()

  expect(wrapper.find('.id').text()).toEqual('12')
  expect(wrapper.find('.name').text()).toEqual('somename3')
  expect(wrapper.find('.capitalizedName').text()).toEqual('Somename3')
  expect(wrapper.find('.upperCaseName').text()).toEqual('SOMENAME3')

  wrapper.unmount()
})
