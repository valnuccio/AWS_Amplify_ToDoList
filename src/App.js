import logo from './logo.svg';
import './App.css';
import {v4 as uuid} from 'uuid';
import React, {useState, useEffect} from 'react';
import {API, graphqlOperation, Amplify, Storage} from 'aws-amplify';
import awsconfig from './aws-exports';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import {createTodo} from './graphql/mutations'

Amplify.configure(awsconfig)




const listItems = `
  query MyQuery {
    listTodos {
      items {
        id
        name
        description
        filePath
      }
    }
  }
`


// used for rendering each item
const ListItem = ({id, name, description, imageUrl}) =>{





  return (
    <>
    <h3>{name}</h3>
    <p>{description}</p>
   
   <img src={imageUrl}/>
    </>
  )
  }


  const AddToDoForm = ({onUpload})=>{
    const [toDoName, setToDoName] = useState('')
    const [toDoDescription, setToDoDescription] = useState('')
    const [jpgData, setJpgData] = useState()

    

    const uploadImage = async () =>{
      let toDo={
         name:toDoName,
         description:toDoDescription 
      } 
      
      console.log(toDo)

      const {key} = await Storage.put(`${uuid()}.mp3`, jpgData, {contentType:'image/png, image/jpeg'})

      const createImgObj = {
        id:uuid(),
        name:toDoName,
        description: toDoDescription,
        filePath: key
      }

      await API.graphql(graphqlOperation(createTodo, {input:createImgObj}) )
      onUpload()
    }

      return(
        <form onSubmit={(e)=>{
          e.preventDefault();
          uploadImage()}}>
          <input type={'text'} value={toDoName} onChange={(e)=>setToDoName(e.target.value)}/>
          <input type={'text'} value={toDoDescription} onChange={(e)=>setToDoDescription(e.target.value)}/>
          <input type={'file'} accept="image/png, image/jpeg" onChange={(e)=> setJpgData(e.target.files[0])}/>
          <input type={'submit'}/>
        </form>
      )
    }




function App() {
  // this is setup for the 'fetch' essentially
     // this has to be an async request so it waits 
  const[list, setListItems] = useState(null)
  const[listUrls, setListUrls] = useState(null)
  const [showForm, setShowForm] = useState(false)



  const getImages = async items => {

   let urlArray=[]
    for(let index=0; index<items.length;index++){
      const toDoFilePath=items[index].filePath
      const toDoAccessUrl= await Storage.get(toDoFilePath)
      const imageObj={id:items[index].id, url: toDoAccessUrl}
      urlArray.push(imageObj)
    }

    setListUrls(urlArray)
}

  const getList = async() => {
    
    // The API.graphql call here is what we imported above
    const { data } = await API.graphql(
      // this is also imported above and we are passing in our query requirements 
      graphqlOperation(listItems)
    );
    // this is basically saying after you get that back to do this with that data
    // IMPORTANT NOTE : you are setting the listItems of the useState here. in order to avoid null items I've incorporated the question marks. 
    // When you make that initial query you are going to get all the info back you would if you were in the aws console. Go back and take a look at that structure
    // to see why and how I only wanted the items themselves below.
      setListItems(data?.listTodos?.items)
      getImages(data?.listTodos?.items)


  }


  useEffect(()=>{
    // calls this once its done rendering the basic page
    getList()}
    
    ,
    [])


  const renderList = () =>{

    
    return list.map((item)=>{
    
    let obj=listUrls.filter((ele)=> ele.id===item.id)
   
    
    return (
    <ListItem id={item.id} name={item.name} description={item.description} imageUrl={obj[0].url} filePath={item.filePath}/>)
  })

  }

  

  return (
    <div className="App">
      <header className="App-header">
        {/* This renders the first time with nothing under it */}
       <h1>To Do List</h1>
       {/* only renders once the info has been set! */}
       
      
       {list && listUrls? <div>{renderList()}</div>:null}
       {showForm? 
       <AddToDoForm onUpload={(e)=>{
         setShowForm(false);
         setListUrls(false)
          getList()
         
      }}/>
      : <button onClick={()=>{setShowForm(true)}}>Click to Add To Do</button>} 
        <div><AmplifySignOut/></div>
        
      </header>
    </div>
  );
}





export default withAuthenticator(App);
