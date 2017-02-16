function savePillToLocalHost(pill){
  var pilltracker = { pills: {} }
  if (localStorage.pilltracker){
    pilltracker = JSON.parse(localStorage.pilltracker);
  }

  pilltracker.pills[pill.name] = pill;
  localStorage.setItem("pilltracker", JSON.stringify(pilltracker))
}

function fetchPillsFromLocalHost(){
  if (localStorage.pilltracker) return JSON.parse(localStorage.pilltracker).pills
  else return false
}

Vue.filter('beautify-date', function (time) {
  return time ? moment(time).format("DD-MM-YYYY [at] HH:mm") : false;
})

Vue.component('medicine', {
  props: ['pill'],
  template: '<div class="pill col-xs-4"> \
            <h3>{{pill.name}}</h3> \
            <p>Remaining: {{pill.stock}}</p> \
            <p v-if="pill.last_dosage_at">Last taken on {{pill.last_dosage_at | beautify-date}}</p>\
            <p></p> \
            <button v-if="canTakeDosage" @click="take">Take a dose</button> \
            <p v-else>Can take next dosage {{timeToDosage}}</p> \
            <div v-if="pill.last_dosage_at" class="medicine-history"><a @click="viewHistory">View History</a></div> \
            <div v-if="displayHistory" class="history"> \
              <ul> \
                <li v-for="item in pill.history"> \
                  Took {{item.amount_taken}} at {{item.taken_at | beautify-date}}. \
                </li> \
              </ul> \
            </div> \
            </div>',
  data: function(){
    return {
      displayHistory: false
    }
  },
  computed: {
    canTakeDosage: function(){
      if (moment(this.pill.next_dosage_at) <= moment() && this.pill.stock) return true
      else return false
    },
    timeToDosage: function() {
      return moment().to(this.pill.next_dosage_at)
    }
  },
  methods: {
    take: function(){
      var now = moment();

      this.pill.stock -= this.pill.dose_amount;
      this.pill.last_dosage_at = now;
      this.pill.next_dosage_at = now.add(this.pill.hours_between_doses, 'hours');
      this.pill.history.push({
        taken_at: now,
        amount_taken: this.pill.dose_amount
      });
      savePillToLocalHost(this.pill);
    },
    viewHistory: function(){
      if (this.displayHistory) return this.displayHistory = false
      else return this.displayHistory = true
    }
  }
})

new Vue({
  el: '#app',
  created: function() {
    this.resetNewPill();
    var pills = fetchPillsFromLocalHost();
    this.pills = Object.values(pills)
  },
  data: {
    showNewPillForm: false,
    pills: []
  },
  methods: {
    resetNewPill: function(){
      this.newPill = {
        name: '',
        stock: 0,
        dose_amount: 0,
        doses_per_day: 0,
        next_dosage_at: 0,
        last_dosage_at: 0,
        history: []
      }
    },
    openPillForm: function(){
      this.showNewPillForm = true;
    },
    addPill: function(e){
      e.preventDefault();

      if (this.newPill.name && this.newPill.stock && this.newPill.dose_amount && this.newPill.doses_per_day){
        this.newPill.hours_between_doses = 24 / this.newPill.doses_per_day
        this.newPill.next_dosage_at = moment();
        this.newPill.last_dosage_at = 0;
        this.pills.push(this.newPill);
        savePillToLocalHost(this.newPill);
        this.resetNewPill();
        this.showNewPillForm = false;
      } else {
        alert("All fields required!");
      }
    }
  }
})
