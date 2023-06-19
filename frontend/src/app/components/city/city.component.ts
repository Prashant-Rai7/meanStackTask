import { Component, OnInit } from '@angular/core';
import { CityService } from '../../Service/city.service';
declare var google: any;
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';


@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.css']
})
export class CityComponent implements OnInit {
  cityForm!: FormGroup;
  citydata :any = {
    countryname: '',
    cityname: '',
}
  addedCities: string[] = [];
  newCity: string = '';
  isValidCity: boolean = false;
  isDuplicateCity: boolean = false;

  //map
  map: any;
  drawingManager: any;
  polygon: any;
  isInZone: boolean = false;
  cordsArray: any = [];
  marker: any;
  autocomplete: any;

  //get country data
  selectedCountry: string = '';
  selectedCountryName!: string;
  countryData: any[] = [];
  cityData: any[] = [];

  countries: any;
  coordinates: any;
  inputValue: any;
  isaddbutton: boolean = true;
  isupdatebutton: boolean = false;
  isCountryDisabled: boolean = false;
  id: any;
  page: any;
  tableSize: any;
  count: any;
  countryName: any;
  city: any

  constructor(private toastr: ToastrService, private _city: CityService, private http: HttpClient, private formBuilder: FormBuilder,){
    this.cityForm = new FormGroup({
      countryname: new FormControl({ value: null, disabled: false }),
      cityname: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.cityForm = this.formBuilder.group({
      countryname: '',
      cityname: ''
    });
    this.loadCities()
    this.getCountryNamefromDB()
    this.initMap();
  }
  
  // To set the Location of searched from Input field and modify it..........
  setLocation(place: any) {
    if (!place.geometry) {
      console.error('No geometry found for place:', place);
      return;
    }

    if (place.geometry && place.geometry.location) {
      this.map.setCenter(place.geometry.location);
      this.map.setZoom(8);
      this.marker.setPosition(place.geometry.location);
      this.marker.setVisible(true);
    }
  }

    
  onPlaceChanged() {
    const place = this.autocomplete.getPlace();
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      // Do something with the latitude and longitude
      console.log('Latitude:', lat);
      console.log('Longitude:', lng);
    }
  }




  // To load the map on Screen.............
  initMap() {
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 4
    });

    const input = document.getElementById('inputCity') as HTMLInputElement;
    this.autocomplete = new google.maps.places.Autocomplete(input);

    this.autocomplete.addListener('place_changed', () => {
      const place: any = this.autocomplete.getPlace();
      this.onPlaceChanged();    //place change in select.
      this.setLocation(place)    // set location in search.

    });


    // Add Location Marker or Pin on the searched location..............
    this.marker = new google.maps.Marker({
      map: this.map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      anchorPoint: new google.maps.Point(0, -29)
    });

    // to draw the polygon on the map using DrawingManager()............
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON]
      }
    });

    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        if (this.polygon) {
          this.polygon.setMap(null);  //clearing old drawn polygon
        }
        this.polygon = event.overlay;
      }
    });

  // Add event listener for polygon drag end
  google.maps.event.addListener(this.polygon, 'dragend', (event: any) => {
    const newCoordinates = this.polygon.getPath().getArray().map((results: { lat: () => any; lng: () => any; }) => ({
      lat: results.lat(),
      lng: results.lng(),
    }));
    // Do something with the updated coordinates
    console.log('Updated Coordinates:', newCoordinates);
  });

}
  
  // To fetch country data from from /countrydata API in dropdown..........
  getCountryNamefromDB() :void{
      this._city.getcountryData().subscribe({
        next: (response) => {
          console.log(response)
          this.countryData = response.countrydata;
        },
        error: (error) => {
          console.log(error);
        }
      });
    }

  loadCities(): void {
    this._city.getcity().subscribe({
    next:  (response) => {
        this.cityData = response;
        // console.log(response);
      },
    error:  (error) => {
        console.log(error);
      }
  });
  }
  

    // To SELECT country selected value from dropdown to use it in city input...........
    onSelected(value: any) {
      this.selectedCountry = value;
      console.log(value)
      const selectedCountryObj = this.countryData.find((country: any) => country._id === value);
      if (selectedCountryObj) {
        this.selectedCountryName = selectedCountryObj.countryName;
        console.log(this.selectedCountryName); // Check if the country name is logged correctly
    
        // city Autocomplete based on selected country from onSelected().............
        this.http.get<any>(`https://restcountries.com/v3.1/name/${this.selectedCountryName}`).subscribe({
          next: (countryRes: any) => {
            let rcountry = countryRes.filter((obj: any) => {
              return obj.name.common == this.selectedCountryName;
            });
    
              //getting country code like IN..............
              let code = rcountry[0].cca2.toLowerCase();
              
              this.autocomplete.setTypes(['(cities)']);
              this.autocomplete.setComponentRestrictions({ 'country': [code] });
          },
          error: (error: any) => {
            console.log("Country Selection Error: ", error.message);
            this.toastr.error(error.message);
          }
          });
  }

      // this.countryData.map((country: any) => {
      //   if (country._id === value) {
      //   }
      // })
      // console.log(this.countryData)
  
      // // city Autocomplete based on selected country from onSelected().............
      // this.http.get<any>(`https://restcountries.com/v3.1/name/${this.countryData}`).subscribe({
  
      //   next: (countryRes: any) => {
      //     let rcountry = countryRes.filter((obj: any) => {
      //       return obj.name.common == this.countryData
      //     })
  
      //     //getting country code like IN..............
      //     let code = rcountry[0].cca2.toLowerCase()
  
      //     this.autocomplete.setTypes(['(cities)']);
      //     this.autocomplete.setComponentRestrictions({ 'country': code });
      //   },
      //   error: (error: any) => {
      //     console.log("Country Selection Error....... ", error.message);
      //     this.toastr.error(error.message)
      //   }
      //   }
      // )
    }

// To check the drawn Zone inside coordinates or not and add city in database.............
  checkZone_AddCity() {
    const geocoder = new google.maps.Geocoder();
    const input = document.getElementById('inputCity') as HTMLInputElement;

    geocoder.geocode({ address: input.value }, (results: any, status: any) => {
      if (status === 'OK') {
        const location = results[0].geometry.location;
        // console.log(location)
        this.isInZone = google.maps.geometry.poly.containsLocation(location, this.polygon);

        if (this.isInZone == true) {
          const polygonPath = this.polygon.getPath();
          this.coordinates = polygonPath.getArray().map((results: { lat: () => any; lng: () => any; }) => ({
            lat: results.lat(),
            lng: results.lng(),
          }));
          console.log('Coordinates:', this.coordinates);
          
            const payload = {
              country_id: this.selectedCountry,
              city: input.value,
              coordinates: this.coordinates
            };
            console.log(payload)
  
            // To add city in Database...............
            this._city.addcity(payload).subscribe({
              next: (response: any) => {
                this.cityData.push(response.city);
                // this.toastr.success(response.message);
                alert(response.message)
                this.loadCities()
                this.getCountryNamefromDB()
                this.marker.setVisible(false); // Hide the marker
                this.marker.setPosition(null); // Clear the marker position
                this.polygon.setMap(null)      // clear the polygon
                this.cityForm.reset();        // clear the form

              },
              error: (error) => {
                console.log(error.error.message)
                alert(error.error.message)
                // this.toastr.warning(error.error.message);
              },
            })
        }else{
          alert("Location not Inside Zone")
        } 
      }
      else {
        alert("please choose city and create a zone")
      }
      
    });
  }




  onPageChange(event: any): void {
    this.page = event;
    this.loadCities();
  }

  onPageSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.loadCities();
  }


  editbtn(_id: string, city: any){
    console.log(city)
    this.id = _id;
    this.inputValue = city.city;
    this.selectedCountryName = city.countryDetails.countryName;


    this.cityForm.get('countryname')?.disable();
    this.cityForm.get('cityname')?.disable();

    this.cityForm.patchValue({
      countryname: city.countryDetails._id,
      cityname: city.city,
    });

    // Enable the update button and disable the add button
    this.isaddbutton = false;
    this.isupdatebutton = true;
    
    const coordinatesdatabase = city.coordinates;
    console.log(coordinatesdatabase);

    this.displayPolygon(city.coordinates); 

  }


  displayPolygon(coordinates: any[]) {
    const polygonPath = coordinates.map((coord: any) => new google.maps.LatLng(coord.lat, coord.lng));
  
    // Remove previous polygon if exists
    if (this.polygon) {
      this.polygon.setMap(null);
    }

    // Create and display the polygon
    this.polygon = new google.maps.Polygon({
      paths: polygonPath,
      editable: true,
      draggable: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
    this.polygon.setMap(this.map);

  //to Zoom the selected location inside zone.............
  const bounds = new google.maps.LatLngBounds();
  coordinates.forEach((coord: any) => {
    bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
  });
  this.map.fitBounds(bounds);
}



updateCity() {


  if (this.inputValue) {
    // Get the updated coordinates
    const newCoordinates = this.polygon.getPath().getArray().map((results: { lat: () => any; lng: () => any; }) => ({
      lat: results.lat(),
      lng: results.lng(),
    }));
    console.log(newCoordinates)
    const payload = {
      city: this.inputValue,
      coordinates: newCoordinates // Updated coordinates
    };
    
    this._city.updateCity(this.id, payload).subscribe({
      next: (response: any) => {
        console.log(response);
        alert(response.message);
        // Reset the form and button states
        this.isupdatebutton = false;
        this.isaddbutton = true;
        this.cityForm.get('countryname')?.enable();
        this.cityForm.get('cityname')?.enable();
        this.loadCities()
        this.getCountryNamefromDB()
        this.polygon.setMap(null)      // clear the polygon
        this.cityForm.reset();        // clear the form
      },
      error: (error: any) => {
        console.log(error);
        alert(error.error.message);
      }
    });
  } else {
    alert('Please enter a city name.');
  }

}

}
