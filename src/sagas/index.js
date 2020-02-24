import LoginSaga from '../pages/admin/Login/sagas';
import PartnerSaga from '../pages/partner/Account/sagas';
import { fork } from 'redux-saga/effects'


export default function* IndexSaga () {  
  yield fork(LoginSaga);
  yield fork(PartnerSaga);
}