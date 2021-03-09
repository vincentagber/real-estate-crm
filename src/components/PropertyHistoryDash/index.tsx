import React from 'react';
import PropertySelectList from './PropertySelectList/index';
import DetailedHistory from '../DetailedHistory/index';
import AddPropertyModal from './PropertySelectList/addPropertyModal';
import { Property } from './PropertySelectList/types';
import { Activity } from '../ActivityTable/types';
import ConfirmationModal from '../ConfirmationModal';
import { makeStyles, Theme, Typography } from '@material-ui/core';

const properties = [
    {
       addrLineOne: '75 Terra Crescent',
       city: 'Toronto', 
       province: 'ON',
       postalCode: 'L6X6X6', 
       favourited: true,
       activities: [{ id: 1, title: 'Showing', description: '', date: '2021-02-21' }],
       notes: 'Really liked this house. Should follow up in a week.',
    },
    {
        addrLineOne: '99 Fern Blvd',
        city: 'Toronto', 
        province: 'ON',
        postalCode: 'L6X6X6', 
        favourited: false,
        activities: [{ id: 1, title: 'Follow-up', description: '', date: '2021-02-01' }],
        notes: 'Ya',
    },
    {
        addrLineOne: '123 John Street',
        city: 'Toronto', 
        province: 'ON',
        postalCode: 'L6X6X6',  
        favourited: true,
        activities: [{ id: 1, title: 'Phone Call w/ Client', description: '', date: '2021-01-01' }],
        notes: 'Ya',
    }
]

export default function PropertyHistoryDash() {

    const classes = useStyles();
    
    const [selectedProperty, setSelectedProperty] = React.useState(properties[0] || null);
    const [modalOpen, setModalOpen] = React.useState(0);
    const [allProperties, setAllProperties] = React.useState(properties);
    const [displayedProperties, setDisplayedProperties] = React.useState(properties);
    const [currTab, setCurrTab] = React.useState('activity');
    const [showFav, setShowFav] = React.useState(false);

    const saveProperty = (property: Property) => {
        allProperties.push(property);
        setAllProperties(allProperties);
        if (!showFav) {
            displayedProperties.push(property);
            setDisplayedProperties(displayedProperties);
        }
        setModalOpen(0);
    }

    const toggleFavourite = (property: Property) => {

        const updatedProperties = allProperties.map(p => {
            if (p == property) {
                property.favourited = !property.favourited;
                return property;
            }
            return p;
        })

        setAllProperties(updatedProperties);
    }

    const addActivity = (activity: Activity) => {
    
        activity.id = selectedProperty.activities.length + 1;
        selectedProperty.activities.push(activity);
  
        // Sort by reverse chronological order
        selectedProperty.activities.sort((a, b) => {
          const aDateParts = a.date.split('-').map(part => parseInt(part));
          const aDate = new Date(aDateParts[0], aDateParts[1] - 1, aDateParts[2]);
  
          const bDateParts = b.date.split('-').map(part => parseInt(part));
          const bDate = new Date(bDateParts[0], bDateParts[1] - 1, bDateParts[2]);
  
          return aDate < bDate ? 1 : -1;
        });

        // Debug this!
        setAllProperties(allProperties);
  
    }

    const updateNotes = (notes: string) => {
        selectedProperty.notes = notes;
        setSelectedProperty(selectedProperty);
        setAllProperties(allProperties);
    }

    const handleSelect = (property: Property) => {
        setCurrTab('activity');
        setSelectedProperty(property);
    }

    const deleteSelectedProperty = () => {
        const updatedProperties = allProperties.filter(property => property != selectedProperty);
        setAllProperties(updatedProperties);

        const updatedDisplay = displayedProperties.filter(property => property != selectedProperty);
        setDisplayedProperties(updatedDisplay);

        setSelectedProperty(updatedDisplay[0]); // TODO: case where no properties
        setModalOpen(0);

    }

    const filterFavourites = () => {
        const newDisplay = allProperties.filter(property => property.favourited);
        setDisplayedProperties(newDisplay);
        setSelectedProperty(newDisplay[0]); // TODO: case where no properties
        setCurrTab('activity');
        setShowFav(true);
    }

    const showAll = () => {
        setDisplayedProperties(allProperties); 
        setShowFav(false);
    }

    return (
        <div style={{ width: "fit-content", margin: "auto"}}>
            <div className={classes.root}>
                <PropertySelectList 
                properties={displayedProperties} 
                selected={selectedProperty} 
                onSelect={handleSelect} />

                <div className={classes.btnContainer}>
                    <button onClick={() => setModalOpen(1)} className={classes.clearBtn}> <Typography variant="button">+ Add Property</Typography> </button>
                    {properties.length > 0 ? (<button onClick={() => setModalOpen(2)} className={classes.clearBtn}> <Typography variant="button">Delete Property </Typography> </button>) : null}
                    {showFav ? <button onClick={() => showAll()} className={classes.clearBtn}> <Typography variant="button">Show All</Typography> </button>
                    : <button onClick={() => filterFavourites()} className={classes.clearBtn}> <Typography variant="button">Show Favourites</Typography> </button>}
                </div>
            </div>

        <DetailedHistory currTab={currTab} setCurrTab={(value) => setCurrTab(value)}
        property={selectedProperty} toggleFavourite={toggleFavourite} addActivity={addActivity} updateNotes={updateNotes} />
        <AddPropertyModal open={modalOpen === 1} onCancel={() => setModalOpen(0)} onSave={saveProperty}/>
        <ConfirmationModal open={modalOpen === 2} onCancel={() => setModalOpen(0)} onContinue={deleteSelectedProperty} 
        actionDescription={`delete property ${selectedProperty.addrLineOne}`} />
        </div>
    )
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
      margin: theme.spacing(3),
      marginRight: 0,
      padding: '20px 20px',
      display: 'inline-block'
    },
    button: {
      background: "white",
      color: "#b2b6bf",
      padding: '4px 8px',
      border: '1px solid #e1e4eb',
      borderRadius: '7px',
      outline: 'none',
      width: '200px',
      marginBottom: 5,
      '&:hover' : {
        opacity: 1,
        background: "#e6f0ff",
        color: '#0C3A77',
        border: '1px solid #0C3A77'
      }
    },
    buttonSelected: {
        background: "#e6f0ff",
        color: '#0C3A77',
        border: '1px solid #0C3A77',
        padding: '4px 8px',
        borderRadius: '7px',
        outline: 'none',
        width: '200px',
        marginBottom: 5,
    },
    btnContainer: {
        borderTop: '2px solid #e1e4eb',
        marginTop: 5,
        paddingTop: '5px',
        width: '200px',
        // display: 'inline-block',
    },
    clearBtn: {
        border: 'none',
        outline: 'none',
        background: 'none',
        color: "#202021",
        opacity: .3,
        '&:hover' : {
            color: "#0C3A77",
            opacity: 1,
        }
    }
  }));